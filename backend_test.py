#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Multilingual Marketplace
Tests all endpoints including authentication, products, orders, and payments
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class MarketplaceAPITester:
    def __init__(self, base_url="https://buy-sell-zone.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    expected_status: int = 200) -> tuple[bool, Dict[str, Any]]:
        """Make HTTP request and validate response"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"status_code": response.status_code, "text": response.text}

            if not success:
                print(f"   Status: {response.status_code}, Expected: {expected_status}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")

            return success, response_data

        except Exception as e:
            print(f"   Request failed: {str(e)}")
            return False, {"error": str(e)}

    def test_categories_endpoint(self):
        """Test categories endpoint"""
        success, data = self.make_request('GET', 'categories')
        
        if success and isinstance(data, list) and len(data) > 0:
            # Check if categories have proper structure
            first_category = data[0]
            has_required_fields = all(key in first_category for key in ['id', 'name'])
            if has_required_fields and isinstance(first_category['name'], dict):
                # Check multilingual support
                has_languages = all(lang in first_category['name'] for lang in ['uz', 'ru', 'en'])
                self.log_test("Categories Endpoint", has_languages, 
                            f"Found {len(data)} categories with multilingual support")
            else:
                self.log_test("Categories Endpoint", False, "Categories missing required structure")
        else:
            self.log_test("Categories Endpoint", False, "Failed to get categories or empty response")

    def test_products_endpoint(self):
        """Test products endpoint"""
        success, data = self.make_request('GET', 'products')
        
        if success and isinstance(data, list):
            self.log_test("Products Endpoint", True, f"Found {len(data)} products")
            
            # Test with category filter
            success_cat, cat_data = self.make_request('GET', 'products?category=electronics')
            if success_cat:
                self.log_test("Products Category Filter", True, f"Electronics: {len(cat_data)} products")
            else:
                self.log_test("Products Category Filter", False, "Category filter failed")
                
            # Test with search
            success_search, search_data = self.make_request('GET', 'products?search=phone')
            if success_search:
                self.log_test("Products Search", True, f"Search results: {len(search_data)} products")
            else:
                self.log_test("Products Search", False, "Search functionality failed")
        else:
            self.log_test("Products Endpoint", False, "Failed to get products")

    def test_user_registration(self):
        """Test user registration"""
        test_user_data = {
            "email": "test_buyer@marketplace.uz",
            "password": "testpass123",
            "full_name": "Test Buyer",
            "phone": "+998901234567",
            "role": "buyer",
            "language": "uz"
        }
        
        success, data = self.make_request('POST', 'auth/register', test_user_data, 200)
        
        if success and 'access_token' in data and 'user' in data:
            self.token = data['access_token']
            self.user_id = data['user']['id']
            self.log_test("User Registration", True, f"User ID: {self.user_id}")
        else:
            self.log_test("User Registration", False, "Registration failed or missing token")

    def test_user_login(self):
        """Test user login with provided credentials"""
        login_data = {
            "email": "buyer@marketplace.uz",
            "password": "buyer123"
        }
        
        success, data = self.make_request('POST', 'auth/login', login_data, 200)
        
        if success and 'access_token' in data and 'user' in data:
            self.token = data['access_token']
            self.user_id = data['user']['id']
            self.log_test("User Login (Test Credentials)", True, f"User: {data['user']['full_name']}")
        else:
            self.log_test("User Login (Test Credentials)", False, "Login failed with test credentials")

    def test_user_profile(self):
        """Test getting user profile"""
        if not self.token:
            self.log_test("User Profile", False, "No authentication token")
            return
            
        success, data = self.make_request('GET', 'auth/me')
        
        if success and 'id' in data and 'email' in data:
            self.log_test("User Profile", True, f"Profile for: {data['email']}")
        else:
            self.log_test("User Profile", False, "Failed to get user profile")

    def test_create_order(self):
        """Test order creation"""
        if not self.token:
            self.log_test("Create Order", False, "No authentication token")
            return
            
        # First get a product to order
        success, products = self.make_request('GET', 'products')
        if not success or not products:
            self.log_test("Create Order", False, "No products available for order")
            return
            
        product = products[0]
        order_data = {
            "items": [{
                "product_id": product['id'],
                "quantity": 1,
                "price": product['price']
            }],
            "shipping_address": {
                "street": "Test Street 123",
                "city": "Tashkent",
                "phone": "+998901234567"
            },
            "payment_method": "payme",
            "language": "uz"
        }
        
        success, data = self.make_request('POST', 'orders', order_data, 200)
        
        if success and 'id' in data:
            order_id = data['id']
            self.log_test("Create Order", True, f"Order ID: {order_id}")
            
            # Test payment processing
            payment_data = {
                "order_id": order_id,
                "payment_method": "payme"
            }
            
            payment_success, payment_response = self.make_request('POST', 'payments/process', payment_data)
            if payment_success and payment_response.get('status') == 'success':
                self.log_test("Payment Processing", True, f"Payment ID: {payment_response.get('payment_id')}")
            else:
                self.log_test("Payment Processing", False, "Payment processing failed")
        else:
            self.log_test("Create Order", False, "Order creation failed")

    def test_get_orders(self):
        """Test getting user orders"""
        if not self.token:
            self.log_test("Get Orders", False, "No authentication token")
            return
            
        success, data = self.make_request('GET', 'orders')
        
        if success and isinstance(data, list):
            self.log_test("Get Orders", True, f"Found {len(data)} orders")
        else:
            self.log_test("Get Orders", False, "Failed to get orders")

    def test_product_detail(self):
        """Test getting individual product details"""
        # First get products list
        success, products = self.make_request('GET', 'products')
        if not success or not products:
            self.log_test("Product Detail", False, "No products available")
            return
            
        product_id = products[0]['id']
        success, data = self.make_request('GET', f'products/{product_id}')
        
        if success and data.get('id') == product_id:
            self.log_test("Product Detail", True, f"Product: {data.get('title', {}).get('en', 'Unknown')}")
        else:
            self.log_test("Product Detail", False, "Failed to get product details")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Multilingual Marketplace API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test public endpoints first
        self.test_categories_endpoint()
        self.test_products_endpoint()
        self.test_product_detail()
        
        # Test authentication
        self.test_user_login()  # Try with provided test credentials first
        if not self.token:
            self.test_user_registration()  # Fallback to registration
        
        # Test authenticated endpoints
        if self.token:
            self.test_user_profile()
            self.test_create_order()
            self.test_get_orders()
        else:
            print("⚠️  Skipping authenticated tests - no valid token")
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  • {test['name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = MarketplaceAPITester()
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())