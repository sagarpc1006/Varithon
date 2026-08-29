import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

def run_auth_tests():
    c = Client()
    print("=== Running WariMitra Authentication & Role Isolation Tests ===")

    # 1. Unregistered Phone on Pilgrim Portal -> Expect 404 & USER_NOT_FOUND
    r = c.post('/api/auth/login/', json.dumps({
        'identifier': '9123450000',
        'password': 'somepassword',
        'role': 'pilgrim'
    }), content_type='application/json')
    assert r.status_code == 404, f"Expected 404, got {r.status_code}"
    data = r.json()
    assert data.get('code') == 'USER_NOT_FOUND', f"Expected code USER_NOT_FOUND, got {data}"
    print(" [PASS] Unregistered Pilgrim Phone returns 404 with USER_NOT_FOUND")

    # 2. Unregistered Email on Admin Portal -> Expect 404 & USER_NOT_FOUND
    r = c.post('/api/auth/login/', json.dumps({
        'identifier': 'unknown.officer@varimitra.org',
        'password': 'somepassword',
        'role': 'admin'
    }), content_type='application/json')
    assert r.status_code == 404, f"Expected 404, got {r.status_code}"
    data = r.json()
    assert data.get('code') == 'USER_NOT_FOUND', f"Expected code USER_NOT_FOUND, got {data}"
    print(" [PASS] Unregistered Admin Email returns 404 with USER_NOT_FOUND")

    # 3. Admin Account logging in on Pilgrim Portal -> Expect 403 & ROLE_MISMATCH_ADMIN
    r = c.post('/api/auth/login/', json.dumps({
        'identifier': 'admin@varimitra.org',
        'password': 'admin123',
        'role': 'pilgrim'
    }), content_type='application/json')
    assert r.status_code == 403, f"Expected 403, got {r.status_code} {r.json()}"
    data = r.json()
    assert data.get('code') == 'ROLE_MISMATCH_ADMIN', f"Expected ROLE_MISMATCH_ADMIN, got {data}"
    print(" [PASS] Admin entering credentials in Pilgrim Portal is strictly rejected (403 ROLE_MISMATCH_ADMIN)")

    # 4. Pilgrim Account logging in on Admin Portal -> Expect 403 & ROLE_MISMATCH_PILGRIM
    r = c.post('/api/auth/login/', json.dumps({
        'identifier': '9876543210',
        'password': 'password',
        'role': 'admin'
    }), content_type='application/json')
    assert r.status_code == 403, f"Expected 403, got {r.status_code} {r.json()}"
    data = r.json()
    assert data.get('code') == 'ROLE_MISMATCH_PILGRIM', f"Expected ROLE_MISMATCH_PILGRIM, got {data}"
    print(" [PASS] Pilgrim entering credentials in Admin Portal is strictly rejected (403 ROLE_MISMATCH_PILGRIM)")

    # 5. Valid Pilgrim Login -> Expect 200 & role='pilgrim'
    r = c.post('/api/auth/login/', json.dumps({
        'identifier': '9876543210',
        'password': 'password',
        'role': 'pilgrim'
    }), content_type='application/json')
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    session = r.json().get('session')
    assert session['role'] == 'pilgrim', f"Role should be pilgrim, got {session['role']}"
    print(f" [PASS] Valid Pilgrim Login OK: {session['name']} ({session['role']})")

    # 6. Valid Admin Login -> Expect 200 & role='admin'
    r = c.post('/api/auth/login/', json.dumps({
        'identifier': 'admin@varimitra.org',
        'password': 'admin123',
        'role': 'admin'
    }), content_type='application/json')
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    session = r.json().get('session')
    assert session['role'] == 'admin', f"Role should be admin, got {session['role']}"
    print(f" [PASS] Valid Admin Login OK: {session['name']} ({session['role']})")

    # 7. Check Identifier API Test
    r = c.post('/api/auth/check-identifier/', json.dumps({
        'identifier': '9876543210',
        'role': 'pilgrim'
    }), content_type='application/json')
    assert r.status_code == 200
    assert r.json()['exists'] is True and r.json()['role_match'] is True
    print(" [PASS] Check Identifier API OK")

    print("\n=== ALL AUTHENTICATION & ROLE ISOLATION TESTS PASSED 100%! ===")

if __name__ == '__main__':
    run_auth_tests()
