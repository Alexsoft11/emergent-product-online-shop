import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  uz: {
    translation: {
      // Navigation
      home: "Bosh sahifa",
      categories: "Kategoriyalar",
      cart: "Savatcha",
      profile: "Profil",
      login: "Kirish",
      register: "Ro'yxatdan o'tish",
      logout: "Chiqish",
      
      // Product
      products: "Mahsulotlar",
      product: "Mahsulot",
      addToCart: "Savatchaga qo'shish",
      buyNow: "Hozir sotib olish",
      price: "Narx",
      inStock: "Omborda bor",
      outOfStock: "Tugagan",
      category: "Kategoriya",
      description: "Tavsif",
      
      // Cart & Orders
      cartEmpty: "Savatcha bo'sh",
      checkout: "To'lov",
      orderHistory: "Buyurtmalar tarixi",
      orderTotal: "Jami summa",
      shippingAddress: "Yetkazib berish manzili",
      paymentMethod: "To'lov usuli",
      
      // Auth
      email: "Email",
      password: "Parol",
      fullName: "To'liq ism",
      phone: "Telefon",
      confirmPassword: "Parolni tasdiqlang",
      
      // Common
      search: "Qidirish",
      filter: "Filtr",
      sort: "Saralash",
      loading: "Yuklanmoqda...",
      error: "Xatolik",
      success: "Muvaffaqiyatli",
      cancel: "Bekor qilish",
      confirm: "Tasdiqlash",
      save: "Saqlash",
      edit: "Tahrirlash",
      delete: "O'chirish",
      
      // Payment methods
      payme: "Payme",
      click: "Click",
      uzum_nasiya: "Uzum Nasiya",
      apelsin: "Apelsin",
      
      // Categories
      electronics: "Elektronika",
      clothing: "Kiyim",
      home: "Uy uchun",
      beauty: "Go'zallik",
      sports: "Sport",
      books: "Kitoblar"
    }
  },
  ru: {
    translation: {
      // Navigation
      home: "Главная",
      categories: "Категории",
      cart: "Корзина",
      profile: "Профиль",
      login: "Войти",
      register: "Регистрация",
      logout: "Выйти",
      
      // Product
      products: "Товары",
      product: "Товар",
      addToCart: "В корзину",
      buyNow: "Купить сейчас",
      price: "Цена",
      inStock: "В наличии",
      outOfStock: "Нет в наличии",
      category: "Категория",
      description: "Описание",
      
      // Cart & Orders
      cartEmpty: "Корзина пуста",
      checkout: "Оформить заказ",
      orderHistory: "История заказов",
      orderTotal: "Итого",
      shippingAddress: "Адрес доставки",
      paymentMethod: "Способ оплаты",
      
      // Auth
      email: "Email",
      password: "Пароль",
      fullName: "Полное имя",
      phone: "Телефон",
      confirmPassword: "Подтвердить пароль",
      
      // Common
      search: "Поиск",
      filter: "Фильтр",
      sort: "Сортировка",
      loading: "Загрузка...",
      error: "Ошибка",
      success: "Успешно",
      cancel: "Отмена",
      confirm: "Подтвердить",
      save: "Сохранить",
      edit: "Редактировать",
      delete: "Удалить",
      
      // Payment methods
      payme: "Payme",
      click: "Click",
      uzum_nasiya: "Uzum Насрочка",
      apelsin: "Apelsin",
      
      // Categories
      electronics: "Электроника",
      clothing: "Одежда",
      home: "Для дома",
      beauty: "Красота",
      sports: "Спорт",
      books: "Книги"
    }
  },
  en: {
    translation: {
      // Navigation
      home: "Home",
      categories: "Categories",
      cart: "Cart",
      profile: "Profile",
      login: "Login",
      register: "Register",
      logout: "Logout",
      
      // Product
      products: "Products",
      product: "Product",
      addToCart: "Add to Cart",
      buyNow: "Buy Now",
      price: "Price",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      category: "Category",
      description: "Description",
      
      // Cart & Orders
      cartEmpty: "Cart is empty",
      checkout: "Checkout",
      orderHistory: "Order History",
      orderTotal: "Total Amount",
      shippingAddress: "Shipping Address",
      paymentMethod: "Payment Method",
      
      // Auth
      email: "Email",
      password: "Password",
      fullName: "Full Name",
      phone: "Phone",
      confirmPassword: "Confirm Password",
      
      // Common
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      confirm: "Confirm",
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      
      // Payment methods
      payme: "Payme",
      click: "Click",
      uzum_nasiya: "Uzum Installment",
      apelsin: "Apelsin",
      
      // Categories
      electronics: "Electronics",
      clothing: "Clothing",
      home: "Home & Garden",
      beauty: "Beauty & Health",
      sports: "Sports & Outdoors",
      books: "Books & Media"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'uz',
    debug: process.env.NODE_ENV === 'development',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;