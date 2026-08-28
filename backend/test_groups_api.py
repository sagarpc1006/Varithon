import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth.models import User
from wari_core.models import Group, GroupMember, GroupMessage, MessageReport

def run_tests():
    client = APIClient()
    user = User.objects.first()
    client.force_authenticate(user=user)
    print(f"Testing with authenticated user: {user.username}")

    # 1. Test GroupListView GET
    resp = client.get('/api/groups/')
    assert resp.status_code == 200, f"GroupListView GET failed: {resp.status_code}"
    print(f"GroupListView GET: {resp.data['count']} groups returned")

    # 2. Test GroupListView POST (Create Group)
    resp = client.post('/api/groups/', {'name': 'Integration Test Group', 'route_info': 'Test Route', 'group_type': 'PUBLIC'}, format='json')
    assert resp.status_code == 201, f"GroupListView POST failed: {resp.status_code}"
    new_group_id = resp.data['group']['id']
    print(f"Group created with ID: {new_group_id}")

    # 3. Test GroupDetailView GET
    resp = client.get(f'/api/groups/{new_group_id}/')
    assert resp.status_code == 200, f"GroupDetailView GET failed: {resp.status_code}"
    print(f"GroupDetailView: {resp.data['name']}")

    # 4. Test GroupMessageListView POST (Send Message)
    resp = client.post(f'/api/groups/{new_group_id}/messages/', {'content': 'Hello from automated integration test!'}, format='json')
    assert resp.status_code == 201, f"GroupMessageListView POST failed: {resp.status_code}"
    msg_id = resp.data['data']['id']
    print(f"Message sent with ID: {msg_id}")

    # 5. Test GroupAnnouncementView POST (Admin Announcement)
    resp = client.post(f'/api/groups/{new_group_id}/announcements/', {'content': 'Official Test Announcement ⚠️'}, format='json')
    assert resp.status_code == 201, f"Announcement failed: {resp.status_code}"
    announcement_msg_id = resp.data['data']['id']
    print(f"Announcement posted with ID: {announcement_msg_id}")

    # 6. Test GroupMessageActionView (Pin message)
    resp = client.patch(f'/api/groups/{new_group_id}/messages/{msg_id}/', {'is_pinned': True}, format='json')
    assert resp.status_code == 200, f"Pin failed: {resp.status_code}"
    print(f"Pin status: {resp.data['is_pinned']}")

    # 7. Test GroupMessageReportView POST
    resp = client.post(f'/api/groups/{new_group_id}/messages/{msg_id}/report/', {'reason': 'Test flag'}, format='json')
    assert resp.status_code == 201, f"Report failed: {resp.status_code}"
    report_id = resp.data['report']['id']
    print(f"Report created with ID: {report_id}")

    # 8. Test AdminGroupStatsView GET
    resp = client.get('/api/admin/groups/stats/')
    assert resp.status_code == 200, f"Admin stats failed: {resp.status_code}"
    print(f"Admin Stats: Total Groups={resp.data['total_groups']}, Total Members={resp.data['total_members']}, Reports={resp.data['pending_reports']}")

    # 9. Test AdminReportsListView resolve
    resp = client.post(f'/api/admin/groups/reports/{report_id}/', {'action': 'resolve', 'action_taken': 'Verified and cleared'}, format='json')
    assert resp.status_code == 200, f"Report resolve failed: {resp.status_code}"
    print(f"Report resolved: {resp.data['report']['status']}")

    print("\nALL 9 API ENDPOINT TESTS PASSED SUCCESSFULLY! [OK]")

if __name__ == '__main__':
    run_tests()

