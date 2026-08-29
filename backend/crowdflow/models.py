from django.db import models
from django.contrib.auth.models import User

class Zone(models.Model):
    name = models.CharField(max_length=150, unique=True)
    name_mr = models.CharField(max_length=150, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    boundary_geojson = models.JSONField(blank=True, null=True)
    max_safe_capacity = models.IntegerField(default=50000)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (Max: {self.max_safe_capacity})"


class CrowdDensityReading(models.Model):
    DENSITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )
    SOURCE_CHOICES = (
        ('crowdvision', 'CrowdVision Camera'),
        ('simulated', 'Simulated Stream'),
    )

    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='density_readings')
    person_count = models.IntegerField()
    density_level = models.CharField(max_length=20, choices=DENSITY_CHOICES, default='low')
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES, default='simulated')
    recorded_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-recorded_at']

    def __str__(self):
        return f"{self.zone.name}: {self.person_count} ({self.density_level}) at {self.recorded_at}"


class ZoneCapacityStatus(models.Model):
    STATUS_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )
    TREND_CHOICES = (
        ('increasing', 'Increasing'),
        ('decreasing', 'Decreasing'),
        ('stable', 'Stable'),
    )

    zone = models.OneToOneField(Zone, on_delete=models.CASCADE, related_name='capacity_status')
    current_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='low')
    risk_score = models.IntegerField(default=15)  # 0 to 100
    movement_direction = models.CharField(max_length=100, default='Forward')
    movement_speed_kmh = models.FloatField(default=3.5)
    trend = models.CharField(max_length=20, choices=TREND_CHOICES, default='stable')
    last_breach_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.zone.name} - Status: {self.current_status}, Risk: {self.risk_score}"


class CrowdAlert(models.Model):
    RISK_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )

    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='crowd_alerts')
    title = models.CharField(max_length=200)
    description = models.TextField()
    risk_score = models.IntegerField(default=85)
    risk_level = models.CharField(max_length=20, choices=RISK_CHOICES, default='high')
    action_type = models.CharField(max_length=50, default='Deploy')
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.risk_level.upper()}] {self.title} ({self.zone.name})"


class VolunteerDeployment(models.Model):
    STATUS_CHOICES = (
        ('DEPLOYED', 'Deployed'),
        ('EN_ROUTE', 'En Route'),
        ('ACTIVE', 'Active on Ground'),
    )

    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='deployments')
    volunteer_count = models.IntegerField()
    deployed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DEPLOYED')
    notes = models.TextField(blank=True)
    deployed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-deployed_at']

    def __str__(self):
        return f"{self.volunteer_count} volunteers to {self.zone.name} ({self.status})"
