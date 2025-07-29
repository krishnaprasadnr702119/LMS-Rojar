#!/usr/bin/env python3
"""
Test script for portal admin API endpoints to troubleshoot connection issues
"""

import requests
import json
import sys

def test_api_hello():
    """Test the basic API hello endpoint"""
    print("\n🔍 Testing basic API hello endpoint")
    url = 'http://localhost:5000/api/hello'
    try:
        response = requests.get(url)
        
        print(f"URL: {url}")
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API Call Successful!")
            print(f"Message: {data.get('message')}")
        else:
            print(f"❌ API Call Failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Raw Response: {response.text}")
    except Exception as e:
        print(f"❌ Error making request: {str(e)}")

def test_portal_admin_stats():
    """Test the portal admin system stats endpoint"""
    print("\n🔍 Testing portal admin system stats endpoint")
    username = 'krishnaprasad.nr'  # Change this to match your test user
    url = f'http://localhost:5000/api/portal_admin/system_stats?username={username}'
    
    try:
        response = requests.get(url)
        
        print(f"URL: {url}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API Call Successful!")
            print(f"Success: {data.get('success')}")
            if data.get('data'):
                stats = data['data']
                print(f"Employee Count: {stats.get('employee_count', 'N/A')}")
                print(f"Total Employees: {stats.get('total_employees', 'N/A')}")
                print(f"Total Courses: {stats.get('total_courses', 'N/A')}")
                print(f"Organization: {stats.get('organization', {}).get('name', 'N/A')}")
                print("\nFull data structure:")
                print(json.dumps(data, indent=2))
            else:
                print("⚠️ No data in response")
                print("Raw response:", json.dumps(data, indent=2))
        else:
            print(f"❌ API Call Failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Raw Response: {response.text}")
    except Exception as e:
        print(f"❌ Error making request: {str(e)}")

def create_test_user():
    """Create a test portal admin user with organization for testing"""
    print("\n🔍 Creating test portal admin user")
    url = 'http://localhost:5000/api/organizations'
    
    data = {
        "name": "Test Organization",
        "portal_admin": "testadmin",
        "org_domain": "testorg.com",
        "status": "active",
        "admin_password": "password123"
    }
    
    try:
        response = requests.post(url, json=data)
        
        if response.status_code in [200, 201]:
            print("✅ Test user created successfully!")
            result = response.json()
            print(f"Username: {result.get('admin_username')}")
            print(f"Email: {result.get('admin_email')}")
            return result.get('admin_username')
        else:
            print(f"❌ Failed to create test user: {response.status_code}")
            try:
                print(response.json())
            except:
                print(response.text)
            return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

if __name__ == "__main__":
    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "create-user":
            username = create_test_user()
            if username:
                print(f"\nNow testing with created user: {username}")
                test_portal_admin_stats()
        else:
            username = sys.argv[1]
            print(f"Testing with username: {username}")
            test_portal_admin_stats()
    else:
        # Test basic API endpoint first
        test_api_hello()
        
        # Then test portal admin stats
        test_portal_admin_stats()
#                 print(f"Organization: {stats.get('organization', {}).get('name', 'N/A')}")
#             else:
#                 print("⚠️ No data in response")
#         else:
#             print(f"❌ API Call Failed: {response.status_code}")
#             try:
#                 error_data = response.json()
#                 print(f"Error: {error_data}")
#             except:
#                 print(f"Raw Response: {response.text}")
                
#     except Exception as e:
#         print(f"❌ Network Error: {str(e)}")
#         return False
    
#     return response.status_code == 200

# def test_login_flow():
#     """Test the complete login flow"""
#     print("\n🔐 Testing Login Flow...")
#     print("=" * 50)
    
#     try:
#         # Test login endpoint
#         login_data = {
#             'username': 'krishnaprasad.nr',
#             'password': 'portaladmin123'
#         }
        
#         response = requests.post('http://localhost:5000/api/login', json=login_data)
#         print(f"Login Status: {response.status_code}")
        
#         if response.status_code == 200:
#             data = response.json()
#             print(f"Login Success: {data.get('success')}")
#             print(f"Token received: {'Yes' if data.get('token') else 'No'}")
#             print(f"Role: {data.get('role')}")
            
#             if data.get('token'):
#                 # Test if we can decode the token
#                 import jwt
#                 try:
#                     payload = jwt.decode(data['token'], options={"verify_signature": False})
#                     print(f"Token payload: {payload}")
#                     return True
#                 except Exception as e:
#                     print(f"Token decode error: {e}")
#                     return False
#         else:
#             print(f"Login failed: {response.json()}")
#             return False
            
#     except Exception as e:
#         print(f"Login test error: {e}")
#         return False

# if __name__ == "__main__":
#     success = test_portal_admin()
#     api_success = test_frontend_endpoint()
#     login_success = test_login_flow()
    
#     print("\n" + "=" * 50)
#     print("📋 SUMMARY:")
#     print(f"✅ Database setup: {'OK' if success else 'FAILED'}")
#     print(f"✅ API endpoint: {'OK' if api_success else 'FAILED'}")
#     print(f"✅ Login flow: {'OK' if login_success else 'FAILED'}")
    
#     if success and api_success and login_success:
#         print("\n🎉 Backend is working correctly!")
#         print("\n💡 If the frontend UI is still not loading, try:")
#         print("   1. Open browser DevTools (F12)")
#         print("   2. Check Console tab for JavaScript errors")
#         print("   3. Check Network tab to see if API calls are being made")
#         print("   4. Try logging in with: krishnaprasad.nr / portaladmin123")
#         print("   5. Make sure frontend is running on http://localhost:5173")
#     else:
#         print("\n💥 Backend has issues - fix these first!")
