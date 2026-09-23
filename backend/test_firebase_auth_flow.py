import os
import sys
import json
from unittest.mock import patch

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from accounts.models import UserProfile


def test_firebase_backend_flow():
    client = Client()
    print("=== RUNNING FIREBASE AUTHENTICATION & SECURITY TESTS ===")

    # 1. Test: Missing Bearer Token on Protected Endpoint -> HTTP 401
    res = client.get('/api/sos/my-reports/')
    assert res.status_code == 401, f"Expected 401 on protected endpoint without token, got {res.status_code}"
    print(" [PASS] Test 1: Unauthenticated request to protected endpoint rejected with HTTP 401")

    # 2. Test: Invalid / Forged Bearer Token on Protected Endpoint -> HTTP 401
    res = client.get('/api/sos/my-reports/', HTTP_AUTHORIZATION='Bearer fake_or_tampered_token_xyz')
    assert res.status_code == 401, f"Expected 401 for invalid Bearer token, got {res.status_code}"
    print(" [PASS] Test 2: Invalid Bearer token correctly rejected with HTTP 401")

    # 3. Test: FirebaseLoginView with empty or missing token -> HTTP 400
    res = client.post('/api/auth/firebase/', json.dumps({
        'role': 'pilgrim'
    }), content_type='application/json')
    assert res.status_code == 400, f"Expected 400 for missing id_token, got {res.status_code}"
    print(" [PASS] Test 3: FirebaseLoginView requires id_token (HTTP 400)")

    # 4. Test: FirebaseLoginView with invalid token -> HTTP 401
    res = client.post('/api/auth/firebase/', json.dumps({
        'id_token': 'tampered_invalid_token',
        'role': 'pilgrim'
    }), content_type='application/json')
    assert res.status_code == 401, f"Expected 401 for invalid id_token in FirebaseLoginView, got {res.status_code}"
    print(" [PASS] Test 4: FirebaseLoginView rejects invalid id_token with HTTP 401")

    # 5. Test: Role Security — Unprovisioned user attempting role='admin' -> HTTP 403
    mock_claims_attacker = {
        'uid': 'attacker_uid_99999',
        'email': 'attacker@example.com',
        'name': 'Malicious User',
        'sub': 'attacker_uid_99999'
    }
    with patch('accounts.views.verify_id_token', return_value=mock_claims_attacker):
        res = client.post('/api/auth/firebase/', json.dumps({
            'id_token': 'valid_mock_token_attacker',
            'role': 'admin'
        }), content_type='application/json')
        assert res.status_code == 403, f"Expected 403 for unauthorized admin creation, got {res.status_code} {res.json()}"
        print(" [PASS] Test 5: Role Security: Client cannot self-elevate to admin via FirebaseLoginView (HTTP 403)")

    # 6. Test: Role Security — RegisterView and GoogleAuthView reject role='admin' -> HTTP 403
    res_reg = client.post('/api/auth/register/', json.dumps({
        'name': 'Fake Admin',
        'identifier': 'fake.admin@varimitra.org',
        'password': 'password123',
        'role': 'admin'
    }), content_type='application/json')
    assert res_reg.status_code == 403, f"Expected 403 for RegisterView admin role, got {res_reg.status_code}"

    res_goog = client.post('/api/auth/google/', json.dumps({
        'email': 'fake.admin2@varimitra.org',
        'name': 'Fake Admin 2',
        'role': 'admin'
    }), content_type='application/json')
    assert res_goog.status_code == 403, f"Expected 403 for GoogleAuthView admin role, got {res_goog.status_code}"
    print(" [PASS] Test 6: Role Security: RegisterView & GoogleAuthView block role='admin' (HTTP 403)")

    # 7. Test: Valid Firebase Pilgrim Token -> creates user, links firebase_uid, returns session
    test_uid = 'firebase_pilgrim_uid_12345'
    test_email = 'warkari.tester@varimitra.org'
    # Clean up if existing
    User.objects.filter(email=test_email).delete()
    UserProfile.objects.filter(firebase_uid=test_uid).delete()

    mock_claims_pilgrim = {
        'uid': test_uid,
        'email': test_email,
        'name': 'Tester Warkari',
        'phone_number': '+919876501234',
        'sub': test_uid
    }
    with patch('accounts.views.verify_id_token', return_value=mock_claims_pilgrim):
        res = client.post('/api/auth/firebase/', json.dumps({
            'id_token': 'mock_valid_token_pilgrim',
            'role': 'pilgrim'
        }), content_type='application/json')
        assert res.status_code == 200, f"Expected 200 for valid pilgrim sync, got {res.status_code} {res.json()}"
        data = res.json()
        assert data['session']['role'] == 'pilgrim'
        assert data['session']['email'] == test_email
        # Verify persistence in database
        saved_profile = UserProfile.objects.filter(firebase_uid=test_uid).first()
        assert saved_profile is not None, "UserProfile was not saved with firebase_uid"
        assert saved_profile.role == 'pilgrim', "UserProfile role was not set to pilgrim"
        print(f" [PASS] Test 7: New Firebase Pilgrim created and firebase_uid linked ({test_uid})")

    # 8. Test: Existing User Login — Role preservation and firebase_uid lookup
    with patch('accounts.views.verify_id_token', return_value=mock_claims_pilgrim):
        # Attempt to pass role='admin' on existing pilgrim
        res = client.post('/api/auth/firebase/', json.dumps({
            'id_token': 'mock_valid_token_pilgrim',
            'role': 'admin'
        }), content_type='application/json')
        # Should be rejected with 403 because pilgrim cannot access admin portal!
        assert res.status_code == 403, f"Expected 403 when existing pilgrim sends role='admin', got {res.status_code}"
        # Login with role='pilgrim'
        res2 = client.post('/api/auth/firebase/', json.dumps({
            'id_token': 'mock_valid_token_pilgrim',
            'role': 'pilgrim'
        }), content_type='application/json')
        assert res2.status_code == 200
        assert res2.json()['session']['role'] == 'pilgrim'
        print(" [PASS] Test 8: Existing user role strictly preserved; elevation attempts blocked")

    # 9. Test: Authenticated Protected API with Bearer token
    with patch('accounts.authentication.verify_id_token', return_value=mock_claims_pilgrim):
        res_api = client.get('/api/sos/my-reports/', HTTP_AUTHORIZATION='Bearer mock_valid_bearer_token')
        assert res_api.status_code == 200, f"Expected 200 for valid Bearer token on protected endpoint, got {res_api.status_code} {res_api.json()}"
        print(" [PASS] Test 9: Protected API accepts valid Firebase Bearer token and authenticates user")

    # 10. Test: Volunteer Registration Flow via Firebase -> HTTP 202 Pending Approval
    vol_uid = 'firebase_vol_uid_88888'
    vol_email = 'sevekar.test@varimitra.org'
    User.objects.filter(email=vol_email).delete()
    UserProfile.objects.filter(firebase_uid=vol_uid).delete()

    mock_claims_vol = {
        'uid': vol_uid,
        'email': vol_email,
        'name': 'Sevekar Test Volunteer',
        'sub': vol_uid
    }
    with patch('accounts.views.verify_id_token', return_value=mock_claims_vol):
        res_vol = client.post('/api/auth/firebase/', json.dumps({
            'id_token': 'mock_valid_token_vol',
            'role': 'volunteer',
            'name': 'Sevekar Test Volunteer',
            'department': 'Water & Sanitation Seva',
            'squad_id': 'SQD-WATER-99',
        }), content_type='application/json')
        assert res_vol.status_code == 202, f"Expected 202 for volunteer registration, got {res_vol.status_code} {res_vol.json()}"
        vol_data = res_vol.json()
        assert vol_data['status'] == 'pending_approval'
        assert vol_data['session']['is_approved'] is False
        assert vol_data['session']['role'] == 'volunteer'
        saved_vol = UserProfile.objects.filter(firebase_uid=vol_uid).first()
        assert saved_vol is not None and saved_vol.role == 'volunteer'
        assert saved_vol.approval_status == 'pending'
        print(" [PASS] Test 10: Volunteer registration via Firebase sets pending approval and links firebase_uid (HTTP 202)")

    # 11. Test: Rejected Volunteer Login -> HTTP 403 Forbidden with VOLUNTEER_REQUEST_REJECTED
    saved_vol.approval_status = 'rejected'
    saved_vol.is_approved = False
    saved_vol.save()

    with patch('accounts.views.verify_id_token', return_value=mock_claims_vol):
        res_rej = client.post('/api/auth/firebase/', json.dumps({
            'id_token': 'mock_valid_token_vol',
            'role': 'volunteer',
        }), content_type='application/json')
        assert res_rej.status_code == 403, f"Expected 403 for rejected volunteer, got {res_rej.status_code} {res_rej.json()}"
        assert res_rej.json().get('code') == 'VOLUNTEER_REQUEST_REJECTED'
        print(" [PASS] Test 11: Rejected Volunteer Login strictly blocked with HTTP 403 (VOLUNTEER_REQUEST_REJECTED)")

    # 12. Test: Phone Extraction from Normalized Email format
    phone_uid = 'firebase_phone_uid_77777'
    phone_email = '9823112233@varimitra.org'
    User.objects.filter(email=phone_email).delete()
    UserProfile.objects.filter(firebase_uid=phone_uid).delete()

    mock_claims_phone = {
        'uid': phone_uid,
        'email': phone_email,
        'name': 'Ramesh Phone User',
        'sub': phone_uid
    }
    with patch('accounts.views.verify_id_token', return_value=mock_claims_phone):
        res_phone = client.post('/api/auth/firebase/', json.dumps({
            'id_token': 'mock_valid_token_phone',
            'role': 'pilgrim',
            'name': 'Ramesh Phone User'
        }), content_type='application/json')
        assert res_phone.status_code == 200
        phone_prof = UserProfile.objects.filter(firebase_uid=phone_uid).first()
        assert phone_prof is not None
        assert phone_prof.mobile_number == '9823112233'
        assert phone_prof.user.first_name == 'Ramesh'
        print(" [PASS] Test 12: Phone number & full name extracted and synchronized into User and UserProfile")

    # 13. Test: Admin Staff Status Synchronization
    admin_uid = 'firebase_admin_uid_66666'
    admin_email = 'control.room@varimitra.org'
    User.objects.filter(email=admin_email).delete()
    # Pre-provision admin user as required by role security
    admin_user = User.objects.create_user(
        username='admin_control_room',
        email=admin_email,
        first_name='Control',
        last_name='Officer',
        is_staff=False
    )
    admin_prof = UserProfile.objects.create(
        user=admin_user,
        role='admin',
        is_approved=True,
        approval_status='approved'
    )
    mock_claims_admin = {
        'uid': admin_uid,
        'email': admin_email,
        'name': 'Control Officer',
        'sub': admin_uid
    }
    with patch('accounts.views.verify_id_token', return_value=mock_claims_admin):
        res_adm = client.post('/api/auth/firebase/', json.dumps({
            'id_token': 'mock_valid_token_admin',
            'role': 'admin'
        }), content_type='application/json')
        assert res_adm.status_code == 200
        admin_user.refresh_from_db()
        assert admin_user.is_staff is True, "Admin is_staff flag was not synchronized to True"
        admin_prof.refresh_from_db()
        assert admin_prof.firebase_uid == admin_uid, "firebase_uid was not linked to pre-provisioned admin"
        print(" [PASS] Test 13: Pre-provisioned Admin authenticated, firebase_uid linked, and is_staff synced")

    print("\n>>> ALL 13 FIREBASE AUTHENTICATION & SECURITY TESTS PASSED 100%! <<<\n")


if __name__ == '__main__':
    test_firebase_backend_flow()
