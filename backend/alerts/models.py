from django.db import models
from django.contrib.auth.models import User


class Alert(models.Model):
    TYPE_CHOICES = [
        ('announcement', 'Announcement'),
        ('weather_alert', 'Weather Alert'),
        ('route_change', 'Route Change'),
    ]

    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200, blank=True, default='')
    message = models.TextField()

    # Zone: center point + radius (null = global broadcast / announcement)
    zone_lat = models.FloatField(null=True, blank=True)
    zone_lng = models.FloatField(null=True, blank=True)
    radius_km = models.FloatField(null=True, blank=True)

    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.type}] {self.title or self.message[:40]}'
