from django.db import models
from django.contrib.auth.models import User

class SOSReport(models.Model):
    TYPE_CHOICES = [
        ('medical', 'Medical'),
        ('issue', 'Issue'),
        ('lost_item', 'Lost Item'),
        ('restroom', 'Restroom'),
        ('general_issue', 'General Issue'),
    ]
    STATUS_CHOICES = [
        ('active', 'ACTIVE'),
        ('acknowledged', 'ACKNOWLEDGED / RESPONDED'),
        ('resolved', 'RESOLVED'),
        ('open', 'ACTIVE'),
    ]
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reported_sos')
    admin = models.ForeignKey(User, null=True, blank=True, related_name='admin_reports', on_delete=models.SET_NULL)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.TextField(null=True, blank=True)
    lat = models.FloatField()
    lng = models.FloatField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='active')
    admin_reply = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SOS {self.get_type_display()} - {self.reporter.username}"
