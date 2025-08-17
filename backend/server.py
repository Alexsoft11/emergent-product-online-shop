import os
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Multilingual Marketplace API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "marketplace_db")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Security setup
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: str = "buyer"  # buyer, seller, admin
    language: str = "uz"  # uz, ru, en

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    language: str
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ProductCreate(BaseModel):
    title: Dict[str, str]  # {"uz": "title_uz", "ru": "title_ru", "en": "title_en"}
    description: Dict[str, str]
    price: float
    currency: str = "UZS"
    category: str
    images: List[str] = []
    stock_quantity: int
    seller_id: str
    status: str = "active"  # active, inactive, pending
    specifications: Optional[Dict[str, Any]] = {}

class ProductResponse(BaseModel):
    id: str
    title: Dict[str, str]
    description: Dict[str, str]
    price: float
    currency: str
    category: str
    images: List[str]
    stock_quantity: int
    seller_id: str
    status: str
    specifications: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float

class OrderCreate(BaseModel):
    items: List[CartItem]
    shipping_address: Dict[str, str]
    payment_method: str
    language: str = "uz"

class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: List[CartItem]
    total_amount: float
    currency: str
    status: str
    shipping_address: Dict[str, str]
    payment_method: str
    payment_status: str
    created_at: datetime

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

# Authentication endpoints
@app.post("/api/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    if db.users.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "full_name": user_data.full_name,
        "phone": user_data.phone,
        "role": user_data.role,
        "language": user_data.language,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        full_name=user_data.full_name,
        phone=user_data.phone,
        role=user_data.role,
        language=user_data.language,
        is_active=True,
        created_at=user_doc["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user["is_active"]:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        phone=user.get("phone"),
        role=user["role"],
        language=user["language"],
        is_active=user["is_active"],
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        phone=current_user.get("phone"),
        role=current_user["role"],
        language=current_user["language"],
        is_active=current_user["is_active"],
        created_at=current_user["created_at"]
    )

# Product endpoints
@app.post("/api/products", response_model=ProductResponse)
async def create_product(product_data: ProductCreate, current_user: dict = Depends(require_role(["seller", "admin"]))):
    product_id = str(uuid.uuid4())
    
    product_doc = {
        "id": product_id,
        "title": product_data.title,
        "description": product_data.description,
        "price": product_data.price,
        "currency": product_data.currency,
        "category": product_data.category,
        "images": product_data.images,
        "stock_quantity": product_data.stock_quantity,
        "seller_id": product_data.seller_id if current_user["role"] == "admin" else current_user["id"],
        "status": product_data.status,
        "specifications": product_data.specifications,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    db.products.insert_one(product_doc)
    
    return ProductResponse(**product_doc)

@app.get("/api/products", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    language: str = "uz",
    limit: int = 20,
    skip: int = 0,
    search: Optional[str] = None
):
    query = {"status": "active"}
    
    if category:
        query["category"] = category
    
    if search:
        query["$or"] = [
            {f"title.{language}": {"$regex": search, "$options": "i"}},
            {f"description.{language}": {"$regex": search, "$options": "i"}}
        ]
    
    products = list(db.products.find(query).skip(skip).limit(limit))
    
    return [ProductResponse(**product) for product in products]

@app.get("/api/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return ProductResponse(**product)

# Order endpoints
@app.post("/api/orders", response_model=OrderResponse)
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    order_id = str(uuid.uuid4())
    
    # Calculate total amount
    total_amount = sum(item.price * item.quantity for item in order_data.items)
    
    order_doc = {
        "id": order_id,
        "user_id": current_user["id"],
        "items": [item.dict() for item in order_data.items],
        "total_amount": total_amount,
        "currency": "UZS",
        "status": "pending",
        "shipping_address": order_data.shipping_address,
        "payment_method": order_data.payment_method,
        "payment_status": "pending",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    db.orders.insert_one(order_doc)
    
    return OrderResponse(**order_doc)

@app.get("/api/orders", response_model=List[OrderResponse])
async def get_orders(current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]}
    if current_user["role"] == "admin":
        query = {}  # Admin can see all orders
    
    orders = list(db.orders.find(query).sort("created_at", -1))
    
    return [OrderResponse(**order) for order in orders]

# Mock Payment endpoints
@app.post("/api/payments/process")
async def process_payment(
    order_id: str,
    payment_method: str,
    current_user: dict = Depends(get_current_user)
):
    # Mock payment processing
    payment_methods = ["payme", "click", "uzum_nasiya", "apelsin"]
    
    if payment_method not in payment_methods:
        raise HTTPException(status_code=400, detail="Invalid payment method")
    
    # Update order payment status
    result = db.orders.update_one(
        {"id": order_id, "user_id": current_user["id"]},
        {"$set": {"payment_status": "completed", "status": "confirmed", "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "status": "success",
        "payment_id": str(uuid.uuid4()),
        "message": f"Payment processed successfully via {payment_method}",
        "amount_paid": 0  # Would be actual amount in real implementation
    }

# Categories endpoint
@app.get("/api/categories")
async def get_categories():
    categories = [
        {"id": "electronics", "name": {"uz": "Elektronika", "ru": "Электроника", "en": "Electronics"}},
        {"id": "clothing", "name": {"uz": "Kiyim", "ru": "Одежда", "en": "Clothing"}},
        {"id": "home", "name": {"uz": "Uy uchun", "ru": "Для дома", "en": "Home & Garden"}},
        {"id": "beauty", "name": {"uz": "Go'zallik", "ru": "Красота", "en": "Beauty & Health"}},
        {"id": "sports", "name": {"uz": "Sport", "ru": "Спорт", "en": "Sports & Outdoors"}},
        {"id": "books", "name": {"uz": "Kitoblar", "ru": "Книги", "en": "Books & Media"}},
    ]
    return categories

# Admin endpoints
@app.get("/api/admin/stats")
async def get_admin_stats(current_user: dict = Depends(require_role(["admin"]))):
    stats = {
        "total_users": db.users.count_documents({}),
        "total_products": db.products.count_documents({}),
        "total_orders": db.orders.count_documents({}),
        "active_products": db.products.count_documents({"status": "active"}),
        "pending_orders": db.orders.count_documents({"status": "pending"}),
    }
    return stats

@app.get("/api/admin/users")
async def get_all_users(current_user: dict = Depends(require_role(["admin"]))):
    users = list(db.users.find({}, {"password": 0}))
    return [UserResponse(**user) for user in users]

@app.delete("/api/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(require_role(["admin", "seller"]))):
    query = {"id": product_id}
    if current_user["role"] == "seller":
        query["seller_id"] = current_user["id"]
    
    result = db.products.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found or not authorized")
    
    return {"message": "Product deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)