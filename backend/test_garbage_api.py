import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from wari_core.models import GarbageDustbin

client = APIClient()

def run_tests():
    print("=== Testing Garbage (Dustbin) Management API ===")

    # 1. GET /api/garbage/dustbins/
    res = client.get('/api/garbage/dustbins/')
    assert res.status_code == 200, f"GET failed: {res.status_code}"
    data = res.json()
    assert 'dustbins' in data, "No dustbins key"
    assert 'summary' in data, "No summary key"
    assert len(data['dustbins']) >= 6, f"Expected >= 6 seed dustbins, got {len(data['dustbins'])}"
    print(f"[OK] Step 1: GET /api/garbage/dustbins/ returned {len(data['dustbins'])} dustbins with summary metrics: {data['summary']}")

    # 2. POST /api/garbage/dustbins/ (Admin adds new dustbin)
    new_payload = {
        'name': 'Saswad Test Palkhi Bin 99',
        'name_mr': 'सासवड टेस्ट पालखी कुंडी ९९',
        'category': 'ORGANIC_DRY',
        'location_name': 'Saswad Sector 4 Testing Camp',
        'latitude': 18.3444,
        'longitude': 74.0305,
        'capacity_liters': 240,
        'fill_level_percent': 30,
        'status': 'OPERATIONAL',
        'assigned_squad': 'Test Swachh Squad 01',
    }
    create_res = client.post('/api/garbage/dustbins/', new_payload, format='json')
    assert create_res.status_code == 201, f"Create failed: {create_res.status_code} {create_res.json()}"
    created_id = create_res.json()['dustbin']['id']
    print(f"[OK] Step 2: POST /api/garbage/dustbins/ successfully registered new dustbin ID #{created_id}")

    # 3. User 1-click report overflow
    report_res = client.post(f'/api/garbage/dustbins/{created_id}/report-overflow/', format='json')
    assert report_res.status_code == 200, f"Report overflow failed: {report_res.status_code}"
    rep_data = report_res.json()
    assert rep_data['dustbin']['status'] == 'OVERFLOWING'
    assert rep_data['dustbin']['reported_overflow_count'] >= 1
    print(f"[OK] Step 3: POST /api/garbage/dustbins/{created_id}/report-overflow/ marked dustbin as OVERFLOWING (Reports: {rep_data['dustbin']['reported_overflow_count']})")

    # 4. Admin 1-click Mark Emptied / Cleaned
    empty_res = client.post(f'/api/garbage/dustbins/{created_id}/empty/', format='json')
    assert empty_res.status_code == 200, f"Empty failed: {empty_res.status_code}"
    empty_data = empty_res.json()
    assert empty_data['dustbin']['fill_level_percent'] == 0
    assert empty_data['dustbin']['status'] == 'CLEANED'
    print(f"[OK] Step 4: POST /api/garbage/dustbins/{created_id}/empty/ reset fill level to 0% and marked status CLEANED")

    # 5. Admin Delete / Deactivate
    del_res = client.delete(f'/api/garbage/dustbins/{created_id}/')
    assert del_res.status_code == 200, f"Delete failed: {del_res.status_code}"
    print(f"[OK] Step 5: DELETE /api/garbage/dustbins/{created_id}/ deactivated dustbin point cleanly")

    print("\n[SUCCESS] ALL GARBAGE (DUSTBIN) MANAGEMENT BACKEND & API TESTS PASSED SUCCESSFULLY!")


if __name__ == '__main__':
    run_tests()
