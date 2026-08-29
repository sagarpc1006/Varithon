import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from sos.models import SOSReport

def test_full_sos_lifecycle():
    print("\n--- STARTING FULL SOS LIFECYCLE TEST ---")
    client = APIClient()

    # 1. Setup demo users
    pilgrim_user, _ = User.objects.get_or_create(username='test_pilgrim', defaults={'first_name': 'Santosh Pilgrim'})
    admin_user, _ = User.objects.get_or_create(username='test_admin', defaults={'first_name': 'Seva Marshal', 'is_staff': True})

    # Clear prior test SOS reports
    SOSReport.objects.filter(reporter__in=[pilgrim_user, admin_user]).delete()

    # 2. Test validation: Lost item without description must fail
    res_val = client.post('/api/sos/report/', {'type': 'lost_item', 'lat': 18.52, 'lng': 73.85}, format='json')
    assert res_val.status_code == 400, f"Expected 400 for lost_item without description, got {res_val.status_code}"
    print("[OK] Passed: Lost item required description validation")

    # 3. Create all 4 Help Types
    created_reports = []
    types_to_test = [
        ('medical', 'Pilgrim experiencing heat stroke and needs ORS/Doctor'),
        ('issue', 'Large pothole and crowd bottleneck near temple gate'),
        ('restroom', 'Mobile toilet van #3 out of water replenishment'),
        ('lost_item', 'Lost orange bag with puja items and identity card'),
    ]

    for req_type, desc in types_to_test:
        client.force_authenticate(user=pilgrim_user)
        res = client.post('/api/sos/report/', {
            'type': req_type,
            'description': desc,
            'lat': 18.5204,
            'lng': 73.8567,
        }, format='json')
        assert res.status_code == 201, f"Failed to create {req_type}: {res.data}"
        data = res.json()
        assert data['status'] == 'active', f"Expected status 'active', got {data['status']}"
        assert data['description'] == desc
        created_reports.append(data['id'])
        print(f"[OK] Created {req_type} request (ID: {data['id']}) with status: {data['status']}")

    # 4. Admin fetches nearby feed
    client.force_authenticate(user=admin_user)
    res_feed = client.get('/api/sos/nearby/?lat=18.52&lng=73.85')
    assert res_feed.status_code == 200
    feed_data = res_feed.json()
    assert len(feed_data) >= 4
    print(f"[OK] Admin retrieved {len(feed_data)} total SOS reports from /api/sos/nearby/")

    # 5. Admin replies to first report (Medical)
    med_id = created_reports[0]
    reply_msg = "Ambulance Unit 4 is 300m away and reaching in 2 minutes. Stay calm."
    res_reply = client.post(f'/api/sos/{med_id}/reply/', {'reply': reply_msg}, format='json')
    assert res_reply.status_code == 200, f"Reply failed: {res_reply.data}"
    med_data = res_reply.json()
    assert med_data['status'] == 'acknowledged', f"Expected 'acknowledged', got {med_data['status']}"
    assert med_data['admin_reply'] == reply_msg
    print(f"[OK] Admin replied to report #{med_id}. Status transitioned to: {med_data['status']}")

    # 6. Pilgrim fetches their reports and verifies reply
    client.force_authenticate(user=pilgrim_user)
    res_my = client.get('/api/sos/my-reports/')
    assert res_my.status_code == 200
    my_reports = res_my.json()
    my_med = next(r for r in my_reports if r['id'] == med_id)
    assert my_med['admin_reply'] == reply_msg
    assert my_med['status'] == 'acknowledged'
    print(f"[OK] Pilgrim verified received admin reply on report #{med_id}: '{my_med['admin_reply']}'")

    # 7. Admin resolves the report
    client.force_authenticate(user=admin_user)
    res_resolve = client.put(f'/api/sos/{med_id}/status/', {'status': 'resolved'}, format='json')
    assert res_resolve.status_code == 200
    resolved_data = res_resolve.json()
    assert resolved_data['status'] == 'resolved'
    print(f"[OK] Admin resolved report #{med_id}. Status transitioned to: {resolved_data['status']}")

    # 8. Verify report is persisted in database and not deleted
    db_report = SOSReport.objects.get(id=med_id)
    assert db_report.status == 'resolved'
    assert db_report.admin_reply == reply_msg
    print(f"[OK] Verified DB persistence: report #{med_id} exists with status='{db_report.status}' and reply")

    # 9. Verify status filters
    res_active = client.get('/api/sos/nearby/?status=active')
    res_ack = client.get('/api/sos/nearby/?status=acknowledged')
    res_res = client.get('/api/sos/nearby/?status=resolved')

    print(f"[OK] Filters: Active={len(res_active.json())}, Responded={len(res_ack.json())}, Resolved={len(res_res.json())}")
    print("\n--- ALL TESTS PASSED SUCCESSFULLY! ---")

if __name__ == '__main__':
    test_full_sos_lifecycle()
