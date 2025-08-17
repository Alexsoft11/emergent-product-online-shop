import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './i18n';
import './App.css';

// Import UI components
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

// Import icons
import { 
  ShoppingCart, 
  User, 
  Search, 
  Menu, 
  Globe, 
  Star, 
  Plus,
  Minus,
  Trash2,
  Package,
  CreditCard,
  MapPin
} from 'lucide-react';

// Configure axios
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
axios.defaults.baseURL = API_BASE_URL;

const App = () => {
  const { t, i18n } = useTranslation();
  
  // State management
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState('home');
  
  // Auth forms state
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'buyer'
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
    loadCartFromStorage();
  }, []);

  // Set auth header for requests
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUserProfile();
    }
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get('/api/products'),
        axios.get('/api/categories')
      ]);
      
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
      loadOrders();
    } catch (error) {
      console.error('Error loading profile:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const loadOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCartToStorage = (cartItems) => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(endpoint, authForm);
      
      localStorage.setItem('token', response.data.access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      
      setUser(response.data.user);
      setShowAuthDialog(false);
      setAuthForm({ email: '', password: '', fullName: '', phone: '', role: 'buyer' });
      
      if (authMode === 'login') {
        loadOrders();
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert(error.response?.data?.detail || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setOrders([]);
    setCurrentPage('home');
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    let newCart;
    
    if (existingItem) {
      newCart = cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }
    
    setCart(newCart);
    saveCartToStorage(newCart);
  };

  const updateCartQuantity = (productId, change) => {
    const newCart = cart.map(item => {
      if (item.id === productId) {
        const newQuantity = Math.max(0, item.quantity + change);
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean);
    
    setCart(newCart);
    saveCartToStorage(newCart);
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    saveCartToStorage(newCart);
  };

  const processOrder = async (orderData) => {
    try {
      const cartItems = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const response = await axios.post('/api/orders', {
        items: cartItems,
        shipping_address: orderData.address,
        payment_method: orderData.paymentMethod,
        language: i18n.language
      });

      // Process payment
      await axios.post('/api/payments/process', {
        order_id: response.data.id,
        payment_method: orderData.paymentMethod
      });

      setCart([]);
      saveCartToStorage([]);
      loadOrders();
      alert(t('success') + '!');
    } catch (error) {
      console.error('Order error:', error);
      alert(error.response?.data?.detail || 'Order failed');
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.title[i18n.language]?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description[i18n.language]?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Header component
  const Header = () => (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MarketPlace
            </h1>
            <nav className="hidden md:flex space-x-6">
              <Button variant="ghost" onClick={() => setCurrentPage('home')} className="text-slate-600 hover:text-blue-600">
                {t('home')}
              </Button>
              <Button variant="ghost" onClick={() => setCurrentPage('products')} className="text-slate-600 hover:text-blue-600">
                {t('products')}
              </Button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Select onValueChange={changeLanguage} defaultValue={i18n.language}>
              <SelectTrigger className="w-20">
                <Globe className="w-4 h-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uz">🇺🇿 UZ</SelectItem>
                <SelectItem value="ru">🇷🇺 RU</SelectItem>
                <SelectItem value="en">🇬🇧 EN</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => setCurrentPage('cart')} className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 text-xs">
                  {cart.length}
                </Badge>
              )}
            </Button>
            
            {user ? (
              <div className="flex items-center space-x-2">
                <Avatar onClick={() => setCurrentPage('profile')} className="cursor-pointer">
                  <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button variant="ghost" onClick={handleLogout} className="text-slate-600">
                  {t('logout')}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowAuthDialog(true)}>
                <User className="w-4 h-4 mr-2" />
                {t('login')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  // Home page
  const HomePage = () => (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">
            {i18n.language === 'uz' ? 'Eng Yaxshi Mahsulotlar' : 
             i18n.language === 'ru' ? 'Лучшие Товары' : 'Best Products'}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {i18n.language === 'uz' ? 'O\'zbekiston, Rossiya va dunyo mahsulotlari' : 
             i18n.language === 'ru' ? 'Товары из Узбекистана, России и мира' : 'Products from Uzbekistan, Russia and World'}
          </p>
          <Button size="lg" variant="secondary" onClick={() => setCurrentPage('products')}>
            {t('products')}
          </Button>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-8">{t('categories')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(category => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer" 
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setCurrentPage('products');
                  }}>
              <CardContent className="p-6 text-center">
                <h4 className="font-semibold">{category.name[i18n.language]}</h4>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4">
        <h3 className="text-3xl font-bold text-center mb-8">
          {i18n.language === 'uz' ? 'Mashhur Mahsulotlar' : 
           i18n.language === 'ru' ? 'Популярные Товары' : 'Featured Products'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );

  // Product card component
  const ProductCard = ({ product }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="aspect-square bg-slate-100 rounded-md mb-4"></div>
        <CardTitle className="line-clamp-2">{product.title[i18n.language]}</CardTitle>
        <CardDescription className="line-clamp-2">{product.description[i18n.language]}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <span className="text-2xl font-bold text-blue-600">
            {product.price.toLocaleString()} {product.currency}
          </span>
          <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
            {product.stock_quantity > 0 ? t('inStock') : t('outOfStock')}
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => addToCart(product)} 
          disabled={product.stock_quantity === 0}
          className="w-full"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {t('addToCart')}
        </Button>
      </CardFooter>
    </Card>
  );

  // Products page
  const ProductsPage = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters sidebar */}
        <div className="w-full md:w-64">
          <Card>
            <CardHeader>
              <CardTitle>{t('filter')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>{t('category')}</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('category')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{i18n.language === 'uz' ? 'Barchasi' : i18n.language === 'ru' ? 'Все' : 'All'}</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name[i18n.language]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products grid */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-8">{t('loading')}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Cart page
  const CartPage = () => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-8">{t('cart')}</h2>
      
      {cart.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg">{t('cartEmpty')}</p>
          <Button onClick={() => setCurrentPage('products')} className="mt-4">
            {t('products')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-slate-100 rounded"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.title[i18n.language]}</h4>
                      <p className="text-slate-500">{item.price.toLocaleString()} {item.currency}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button size="sm" variant="outline" onClick={() => updateCartQuantity(item.id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('orderTotal')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t('orderTotal')}:</span>
                    <span className="font-semibold">{cartTotal.toLocaleString()} UZS</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                {user ? (
                  <CheckoutDialog />
                ) : (
                  <Button onClick={() => setShowAuthDialog(true)} className="w-full">
                    {t('login')} {t('checkout')}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );

  // Checkout dialog component
  const CheckoutDialog = () => {
    const [checkoutData, setCheckoutData] = useState({
      address: { street: '', city: '', phone: '' },
      paymentMethod: 'payme'
    });

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">
            <CreditCard className="w-4 h-4 mr-2" />
            {t('checkout')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('checkout')}</DialogTitle>
            <DialogDescription>
              {t('orderTotal')}: {cartTotal.toLocaleString()} UZS
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('shippingAddress')}</Label>
              <Input
                placeholder={i18n.language === 'uz' ? 'Ko\'cha' : i18n.language === 'ru' ? 'Улица' : 'Street'}
                value={checkoutData.address.street}
                onChange={(e) => setCheckoutData({
                  ...checkoutData,
                  address: { ...checkoutData.address, street: e.target.value }
                })}
              />
              <Input
                placeholder={i18n.language === 'uz' ? 'Shahar' : i18n.language === 'ru' ? 'Город' : 'City'}
                value={checkoutData.address.city}
                onChange={(e) => setCheckoutData({
                  ...checkoutData,
                  address: { ...checkoutData.address, city: e.target.value }
                })}
                className="mt-2"
              />
              <Input
                placeholder={t('phone')}
                value={checkoutData.address.phone}
                onChange={(e) => setCheckoutData({
                  ...checkoutData,
                  address: { ...checkoutData.address, phone: e.target.value }
                })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>{t('paymentMethod')}</Label>
              <Select value={checkoutData.paymentMethod} onValueChange={(value) => 
                setCheckoutData({ ...checkoutData, paymentMethod: value })
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payme">{t('payme')}</SelectItem>
                  <SelectItem value="click">{t('click')}</SelectItem>
                  <SelectItem value="uzum_nasiya">{t('uzum_nasiya')}</SelectItem>
                  <SelectItem value="apelsin">{t('apelsin')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => processOrder(checkoutData)}>
              {t('confirm')} {t('checkout')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Profile page
  const ProfilePage = () => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
          <TabsTrigger value="orders">{t('orderHistory')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('fullName')}</Label>
                  <Input value={user?.full_name || ''} disabled />
                </div>
                <div>
                  <Label>{t('email')}</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div>
                  <Label>{t('phone')}</Label>
                  <Input value={user?.phone || ''} disabled />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input value={user?.role || ''} disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders">
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                      <p className="text-sm text-slate-600">{order.items.length} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{order.total_amount.toLocaleString()} {order.currency}</p>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // Auth dialog
  const AuthDialog = () => (
    <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{authMode === 'login' ? t('login') : t('register')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <Label>{t('fullName')}</Label>
              <Input
                value={authForm.fullName}
                onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                required
              />
            </div>
          )}
          <div>
            <Label>{t('email')}</Label>
            <Input
              type="email"
              value={authForm.email}
              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>{t('password')}</Label>
            <Input
              type="password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              required
            />
          </div>
          {authMode === 'register' && (
            <div>
              <Label>{t('phone')}</Label>
              <Input
                value={authForm.phone}
                onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" 
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? t('register') : t('login')}
            </Button>
            <Button type="submit">
              {authMode === 'login' ? t('login') : t('register')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'products' && <ProductsPage />}
        {currentPage === 'cart' && <CartPage />}
        {currentPage === 'profile' && user && <ProfilePage />}
      </main>
      
      <AuthDialog />
      
      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">MarketPlace</h3>
              <p className="text-slate-300">
                {i18n.language === 'uz' ? 'Eng yaxshi mahsulotlar eng qulay narxlarda' : 
                 i18n.language === 'ru' ? 'Лучшие товары по доступным ценам' : 
                 'Best products at affordable prices'}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('categories')}</h4>
              <ul className="space-y-2 text-slate-300">
                {categories.slice(0, 4).map(category => (
                  <li key={category.id}>{category.name[i18n.language]}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{i18n.language === 'uz' ? 'Aloqa' : i18n.language === 'ru' ? 'Контакты' : 'Contact'}</h4>
              <ul className="space-y-2 text-slate-300">
                <li>+998 90 123 45 67</li>
                <li>info@marketplace.uz</li>
                <li>Tashkent, Uzbekistan</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('paymentMethod')}</h4>
              <div className="flex space-x-2">
                <div className="bg-slate-800 px-3 py-1 rounded text-sm">Payme</div>
                <div className="bg-slate-800 px-3 py-1 rounded text-sm">Click</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;