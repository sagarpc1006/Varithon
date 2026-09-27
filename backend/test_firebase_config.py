"""
Firebase Authentication Configuration Test Script
Verifies the complete Firebase auth pipeline:
1. Service account credentials loading
2. Firebase Admin SDK initialization  
3. Firebase project ID configuration
4. Token verification readiness
"""

import os
import sys
import json
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.conf import settings

print("=" * 60)
print("  Firebase Authentication Configuration Test")
print("=" * 60)

passed = 0
failed = 0

# Test 1: Check FIREBASE_PROJECT_ID
project_id = getattr(settings, 'FIREBASE_PROJECT_ID', '')
print(f"\n[1] FIREBASE_PROJECT_ID: ", end="")
if project_id:
    print(f"OK -> '{project_id}'")
    passed += 1
else:
    print("FAIL -> NOT SET - Firebase auth will fail!")
    failed += 1

# Test 2: Check credentials file path
cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', '') or os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', '')
print(f"\n[2] Credentials Path (raw): '{cred_path}'")

# Resolve relative path
if cred_path and not os.path.isabs(cred_path):
    resolved = os.path.normpath(os.path.join(str(settings.BASE_DIR), cred_path))
    print(f"    Resolved to: '{resolved}'")
    cred_path = resolved
else:
    resolved = cred_path

if cred_path and os.path.isfile(cred_path):
    print(f"    OK -> File exists")
    passed += 1
    
    # Validate JSON content
    try:
        with open(cred_path, 'r') as f:
            cred_data = json.load(f)
        
        required_keys = ['type', 'project_id', 'private_key', 'client_email']
        missing = [k for k in required_keys if k not in cred_data]
        
        if missing:
            print(f"    FAIL -> Missing required keys: {missing}")
            failed += 1
        else:
            print(f"    OK -> Service account type: {cred_data.get('type')}")
            print(f"    OK -> Project ID in creds: {cred_data.get('project_id')}")
            print(f"    OK -> Client email: {cred_data.get('client_email')}")
            passed += 1
            
            # Verify project IDs match
            if cred_data.get('project_id') == project_id:
                print(f"    OK -> Project IDs match!")
                passed += 1
            else:
                print(f"    FAIL -> MISMATCH! Settings: '{project_id}', Creds: '{cred_data.get('project_id')}'")
                failed += 1
    except json.JSONDecodeError as e:
        print(f"    FAIL -> Invalid JSON: {e}")
        failed += 1
else:
    print(f"    FAIL -> File NOT found at: {cred_path or '(empty path)'}")
    failed += 1

# Test 3: Try initializing Firebase Admin SDK
print(f"\n[3] Firebase Admin SDK Initialization: ", end="")
try:
    from accounts.firebase_auth import _get_app, FirebaseConfigurationError
    app = _get_app()
    if app:
        print(f"OK -> App '{app.name}' initialized!")
        print(f"    Project ID: {app.project_id}")
        passed += 1
    else:
        print("FAIL -> App returned None (credentials file not found)")
        failed += 1
except FirebaseConfigurationError as e:
    print(f"FAIL -> Configuration Error: {e}")
    failed += 1
except Exception as e:
    print(f"FAIL -> Error: {e}")
    failed += 1

# Test 4: Check if verify_id_token function is ready
print(f"\n[4] Token Verification Function: ", end="")
try:
    from accounts.firebase_auth import verify_id_token
    try:
        verify_id_token("test.invalid.token")
    except ValueError as ve:
        print(f"OK -> Ready (correctly rejects invalid tokens)")
        passed += 1
    except FirebaseConfigurationError:
        print(f"FAIL -> Firebase not configured!")
        failed += 1
    except Exception as e:
        print(f"OK -> Callable (rejects dummy token: {type(e).__name__})")
        passed += 1
except ImportError as e:
    print(f"FAIL -> Import Error: {e}")
    failed += 1

# Test 5: Check DRF Authentication class
print(f"\n[5] DRF FirebaseAuthentication Class: ", end="")
try:
    from accounts.authentication import FirebaseAuthentication
    auth_class = FirebaseAuthentication()
    print(f"OK -> Loaded successfully")
    passed += 1
except Exception as e:
    print(f"FAIL -> Error: {e}")
    failed += 1

# Test 6: Check URL routing
print(f"\n[6] Firebase Auth URL endpoint: ", end="")
try:
    from django.urls import reverse
    url = reverse('auth-firebase')
    print(f"OK -> '{url}'")
    passed += 1
except Exception as e:
    print(f"FAIL -> Error: {e}")
    failed += 1

# Test 7: Frontend configuration check
print(f"\n[7] Frontend .env Check:")
frontend_env_path = os.path.join(str(settings.BASE_DIR), '..', 'frontend', '.env')
frontend_env_path = os.path.normpath(frontend_env_path)
if os.path.isfile(frontend_env_path):
    with open(frontend_env_path) as f:
        env_content = f.read()
    
    required_vars = [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_APP_ID',
        'VITE_API_URL',
    ]
    for var in required_vars:
        if var in env_content:
            for line in env_content.split('\n'):
                if line.startswith(var + '='):
                    value = line.split('=', 1)[1].strip()
                    print(f"    OK -> {var} = {value}")
                    passed += 1
                    break
        else:
            print(f"    FAIL -> {var} is MISSING!")
            failed += 1
else:
    print(f"    FAIL -> Frontend .env not found at: {frontend_env_path}")
    failed += 1

print("\n" + "=" * 60)
print(f"  Results: {passed} passed, {failed} failed")
if failed == 0:
    print("  STATUS: ALL TESTS PASSED - Firebase is properly configured!")
else:
    print(f"  STATUS: {failed} issues found - please fix above errors")
print("=" * 60)
