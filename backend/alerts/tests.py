from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta
from django.utils import timezone
from accounts.models import UserProfile
from .models import Alert


class AlertTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Admin user
        self.admin_user = User.objects.create_user(
            username='admin_user', password='password123'
        )
        self.admin_profile = UserProfile.objects.create(
            user=self.admin_user, role='admin', mobile_number='9999999991'
        )

        # Regular user
        self.regular_user = User.objects.create_user(
            username='regular_user', password='password123'
        )
        self.regular_profile = UserProfile.objects.create(
            user=self.regular_user, role='pilgrim', mobile_number='9999999992'
        )

    def test_regular_user_cannot_broadcast(self):
        self.client.force_authenticate(user=self.regular_user)
        res = self.client.post('/api/alerts/broadcast', {
            'type': 'announcement',
            'title': 'Test Announcement',
            'message': 'Everyone please gather.',
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_broadcast_announcement(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.post('/api/alerts/broadcast', {
            'type': 'announcement',
            'title': 'Grand Palkhi Aarti',
            'message': 'Evening Aarti starts at 7 PM.',
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['type'], 'announcement')
        self.assertEqual(res.data['title'], 'Grand Palkhi Aarti')
        self.assertEqual(Alert.objects.count(), 1)

    def test_location_based_alert_validation(self):
        self.client.force_authenticate(user=self.admin_user)
        # Missing zone coordinates and radius
        res = self.client.post('/api/alerts/broadcast', {
            'type': 'weather_alert',
            'title': 'Heavy Rain',
            'message': 'Rain expected.',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid with zone coordinates and radius
        res = self.client.post('/api/alerts/broadcast', {
            'type': 'weather_alert',
            'title': 'Heavy Rain Warning',
            'message': 'Shelter available at Sector 4.',
            'zone_lat': 17.6868,
            'zone_lng': 75.3249,
            'radius_km': 10.0,
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_feed_filtering_by_location(self):
        # Create global announcement
        Alert.objects.create(
            type='announcement',
            title='Global Announcement',
            message='Welcome all pilgrims!',
            created_by=self.admin_user,
        )

        # Create localized weather alert at Pandharpur (17.6868, 75.3249) with 5km radius
        Alert.objects.create(
            type='weather_alert',
            title='Pandharpur Weather Alert',
            message='Localized storm.',
            zone_lat=17.6868,
            zone_lng=75.3249,
            radius_km=5.0,
            created_by=self.admin_user,
        )

        self.client.force_authenticate(user=self.regular_user)

        # User close to Pandharpur (~1km away)
        res_near = self.client.get('/api/alerts/feed', {
            'lat': '17.6800',
            'lng': '75.3200',
        })
        self.assertEqual(res_near.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_near.data), 2)  # Should receive announcement + weather alert

        # User far away (Pune: 18.5204, 73.8567)
        res_far = self.client.get('/api/alerts/feed', {
            'lat': '18.5204',
            'lng': '73.8567',
        })
        self.assertEqual(res_far.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_far.data), 1)  # Only announcement
        self.assertEqual(res_far.data[0]['type'], 'announcement')

    def test_feed_delta_polling_with_since(self):
        self.client.force_authenticate(user=self.regular_user)

        old_alert = Alert.objects.create(
            type='announcement',
            title='Old Alert',
            message='Old news.',
            created_by=self.admin_user,
        )
        # Manually alter created_at
        old_time = timezone.now() - timedelta(hours=2)
        Alert.objects.filter(id=old_alert.id).update(created_at=old_time)

        since_time = (timezone.now() - timedelta(hours=1)).isoformat()

        new_alert = Alert.objects.create(
            type='announcement',
            title='New Alert',
            message='Fresh news.',
            created_by=self.admin_user,
        )

        res = self.client.get(f'/api/alerts/feed?since={since_time}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['title'], 'New Alert')
