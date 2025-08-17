#!/usr/bin/env python3
"""
Seed script to populate the marketplace with sample data
"""
import sys
import os
sys.path.append('/app/backend')

import uuid
from datetime import datetime
from pymongo import MongoClient
from passlib.context import CryptContext

# Database setup
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "marketplace_db"
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def clear_collections():
    """Clear existing data"""
    db.users.delete_many({})
    db.products.delete_many({})
    db.orders.delete_many({})
    print("✅ Cleared existing data")

def seed_users():
    """Create sample users"""
    users = [
        {
            "id": str(uuid.uuid4()),
            "email": "admin@marketplace.uz",
            "password": pwd_context.hash("admin123"),
            "full_name": "Admin User",
            "phone": "+998901234567",
            "role": "admin",
            "language": "uz",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "seller@marketplace.uz",
            "password": pwd_context.hash("seller123"),
            "full_name": "Test Seller",
            "phone": "+998901234568",
            "role": "seller",
            "language": "uz",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "email": "buyer@marketplace.uz",
            "password": pwd_context.hash("buyer123"),
            "full_name": "Test Buyer",
            "phone": "+998901234569",
            "role": "buyer",
            "language": "uz",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    db.users.insert_many(users)
    print(f"✅ Created {len(users)} users")
    return users

def seed_products(seller_user):
    """Create sample products"""
    products = [
        {
            "id": str(uuid.uuid4()),
            "title": {
                "uz": "Samsung Galaxy S24 Ultra",
                "ru": "Samsung Galaxy S24 Ultra",
                "en": "Samsung Galaxy S24 Ultra"
            },
            "description": {
                "uz": "Eng so'nggi Samsung flagmani. 256GB xotira, 5000mAh batareya",
                "ru": "Новейший флагман Samsung. 256ГБ памяти, аккумулятор 5000мАч",
                "en": "Latest Samsung flagship. 256GB storage, 5000mAh battery"
            },
            "price": 15000000,
            "currency": "UZS",
            "category": "electronics",
            "images": ["https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400"],
            "stock_quantity": 10,
            "seller_id": seller_user["id"],
            "status": "active",
            "specifications": {
                "brand": "Samsung",
                "storage": "256GB",
                "ram": "12GB",
                "display": "6.8 inch"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": {
                "uz": "Apple MacBook Pro M3",
                "ru": "Apple MacBook Pro M3",
                "en": "Apple MacBook Pro M3"
            },
            "description": {
                "uz": "Professional laptop Apple'dan. M3 chip, 16GB RAM",
                "ru": "Профессиональный ноутбук от Apple. Чип M3, 16ГБ ОЗУ",
                "en": "Professional laptop from Apple. M3 chip, 16GB RAM"
            },
            "price": 35000000,
            "currency": "UZS",
            "category": "electronics",
            "images": ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"],
            "stock_quantity": 5,
            "seller_id": seller_user["id"],
            "status": "active",
            "specifications": {
                "brand": "Apple",
                "processor": "M3",
                "ram": "16GB",
                "storage": "512GB SSD"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": {
                "uz": "Nike Air Force 1 Oq",
                "ru": "Nike Air Force 1 Белые",
                "en": "Nike Air Force 1 White"
            },
            "description": {
                "uz": "Klassik Nike krossovkalari. Yumshoq, qulay va chiroyli",
                "ru": "Классические кроссовки Nike. Мягкие, удобные и красивые",
                "en": "Classic Nike sneakers. Soft, comfortable and stylish"
            },
            "price": 1500000,
            "currency": "UZS",
            "category": "clothing",
            "images": ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400"],
            "stock_quantity": 20,
            "seller_id": seller_user["id"],
            "status": "active",
            "specifications": {
                "brand": "Nike",
                "type": "Sneakers",
                "material": "Leather",
                "sizes": "40-45"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": {
                "uz": "Adidas Ultraboost 22",
                "ru": "Adidas Ultraboost 22",
                "en": "Adidas Ultraboost 22"
            },
            "description": {
                "uz": "Yugurish uchun professional krossovkalar. Boost texnologiyasi",
                "ru": "Профессиональные кроссовки для бега. Технология Boost",
                "en": "Professional running sneakers. Boost technology"
            },
            "price": 1800000,
            "currency": "UZS",
            "category": "sports",
            "images": ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"],
            "stock_quantity": 15,
            "seller_id": seller_user["id"],
            "status": "active",
            "specifications": {
                "brand": "Adidas",
                "type": "Running shoes",
                "technology": "Boost",
                "weight": "340g"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": {
                "uz": "Dior Sauvage Parfyum",
                "ru": "Парфюм Dior Sauvage",
                "en": "Dior Sauvage Perfume"
            },
            "description": {
                "uz": "Erkaklar uchun lux parfyum. Fresh va kuchli hid",
                "ru": "Роскошный парфюм для мужчин. Свежий и стойкий аромат",
                "en": "Luxury perfume for men. Fresh and long-lasting fragrance"
            },
            "price": 2500000,
            "currency": "UZS",
            "category": "beauty",
            "images": ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=400"],
            "stock_quantity": 8,
            "seller_id": seller_user["id"],
            "status": "active",
            "specifications": {
                "brand": "Dior",
                "volume": "100ml",
                "type": "Eau de Toilette",
                "gender": "Men"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "title": {
                "uz": "Ikea Hemnes Karyola",
                "ru": "Кровать Ikea Hemnes",
                "en": "Ikea Hemnes Bed Frame"
            },
            "description": {
                "uz": "Qattiq yog'och karyola. 160x200 o'lchamdagi matras uchun",
                "ru": "Каркас кровати из массива дерева. Для матраса 160x200",
                "en": "Solid wood bed frame. For 160x200 mattress"
            },
            "price": 3500000,
            "currency": "UZS",
            "category": "home",
            "images": ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400"],
            "stock_quantity": 3,
            "seller_id": seller_user["id"],
            "status": "active",
            "specifications": {
                "brand": "Ikea",
                "material": "Pine wood",
                "size": "160x200cm",
                "color": "White stain"
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    db.products.insert_many(products)
    print(f"✅ Created {len(products)} products")
    return products

def main():
    print("🚀 Starting marketplace data seeding...")
    
    # Clear existing data
    clear_collections()
    
    # Seed users
    users = seed_users()
    seller_user = next((u for u in users if u["role"] == "seller"), None)
    
    # Seed products
    products = seed_products(seller_user)
    
    print("\n📊 Database seeded successfully!")
    print(f"👥 Users: {len(users)}")
    print(f"📦 Products: {len(products)}")
    print("\n🔐 Test credentials:")
    print("Admin: admin@marketplace.uz / admin123")
    print("Seller: seller@marketplace.uz / seller123") 
    print("Buyer: buyer@marketplace.uz / buyer123")

if __name__ == "__main__":
    main()