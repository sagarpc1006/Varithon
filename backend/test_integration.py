import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

def run_tests():
    c = Client()
    print("=== Running VariMitra Integration Tests ===")

    # 1. Test API Root
    r = c.get('/api/')
    assert r.status_code == 200, f"API Root failed: {r.status_code}"
    print(" [PASS] /api/ Root Endpoint OK")

    # 2. Test Pilgrim Login
    r = c.post('/api/auth/login/', json.dumps({
        'identifier': '9876543210',
        'password': 'password',
        'role': 'pilgrim'
    }), content_type='application/json')
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.json()}"
    assert r.json()['session']['role'] == 'pilgrim'
    print(f" [PASS] Pilgrim Login OK: User = {r.json()['session']['name']}")

    # 3. Test Admin Login
    r = c.post('/api/auth/login/', json.dumps({
        'identifier': 'seva.admin@varimitra.org',
        'password': 'password',
        'role': 'admin'
    }), content_type='application/json')
    assert r.status_code == 200, f"Admin login failed: {r.status_code}"
    assert r.json()['session']['role'] == 'admin'
    print(f" [PASS] Admin Login OK: User = {r.json()['session']['name']}")

    # 4. Test Registration
    r = c.post('/api/auth/register/', json.dumps({
        'name': 'Namdev Maharaj',
        'identifier': '9988776655',
        'password': 'testpassword',
        'role': 'pilgrim',
        'organization': 'Pandharpur Dindi No. 12'
    }), content_type='application/json')
    assert r.status_code in [200, 201, 409], f"Registration failed: {r.status_code} {r.json()}"
    print(" [PASS] User Registration API OK")

    # 5. Test Forgot Password
    r = c.post('/api/auth/forgot-password/', json.dumps({
        'identifier': '9876543210',
        'role': 'pilgrim'
    }), content_type='application/json')
    assert r.status_code == 200, f"Forgot password failed: {r.status_code}"
    otp = r.json().get('demo_otp')
    print(f" [PASS] Forgot Password OTP Generated OK: OTP = {otp}")

    # 6. Test Palkhi Location
    r = c.get('/api/maps/palkhi/')
    assert r.status_code == 200, f"Palkhi location failed: {r.status_code}"
    palkhi = r.json()['primary_palkhi']
    print(f" [PASS] Live Palkhi Telemetry OK: ETA = {palkhi['eta_next_stop']}")

    # 7. Test Seva Resources
    r = c.get('/api/resources/')
    assert r.status_code == 200, f"Resources failed: {r.status_code}"
    resources = r.json()['resources']
    print(f" [PASS] Seva Resources OK: Total facilities = {len(resources)}")

    # 8. Test Emergency SOS Dispatch
    r = c.post('/api/sos/', json.dumps({
        'alert_type': 'MEDICAL',
        'caller_name': 'Santosh Shinde',
        'caller_phone': '9876543210',
        'location_name': 'Saswad Ghat Checkpoint #2',
        'description': 'Senior pilgrim feeling dehydrated, medical team needed'
    }), content_type='application/json')
    assert r.status_code == 201, f"SOS trigger failed: {r.status_code}"
    print(f" [PASS] Emergency SOS Dispatch OK: Unit = {r.json()['alert']['dispatched_unit']}")

    # 9. Test Crowd Flow
    r = c.get('/api/crowdflow/')
    assert r.status_code == 200, f"Crowd density failed: {r.status_code}"
    print(f" [PASS] Crowd Flow Status OK")

    # 10. Test AI Chat Companion
    r = c.post('/api/ai/chat/', json.dumps({
        'message': 'Where is the palkhi right now?',
        'language': 'en',
        'user_name': 'Warkari Devotee'
    }), content_type='application/json')
    assert r.status_code == 200, f"AI chat failed: {r.status_code}"
    print(f" [PASS] AI Companion Chat OK: Category = {r.json()['category']}")

    # 11. Test Dashboard Overview
    r = c.get('/api/dashboard/overview/')
    assert r.status_code == 200, f"Overview failed: {r.status_code}"
    print(f" [PASS] Dashboard Overview OK: System Status = {r.json()['system_status']}")

    print("\n=== ALL 11 INTEGRATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == '__main__':
    run_tests()
