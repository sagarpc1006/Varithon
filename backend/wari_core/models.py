from django.db import models

class PalkhiLocation(models.Model):
    STATUS_CHOICES = (
        ('LIVE', 'Live Moving'),
        ('HALTED', 'Temporary Halt / Visava'),
        ('NIGHT_STAY', 'Night Stay / Mukkam'),
    )

    palkhi_name = models.CharField(max_length=150, default='Sant Dnyaneshwar Maharaj Palkhi')
    palkhi_name_mr = models.CharField(max_length=150, default='श्री संत ज्ञानेश्वर महाराज पालखी')
    current_stop = models.CharField(max_length=150, default='Saswad Checkpoint')
    current_stop_mr = models.CharField(max_length=150, default='सासवड चेकपॉईंट')
    next_stop = models.CharField(max_length=150, default='Jejuri Pavan Khind')
    next_stop_mr = models.CharField(max_length=150, default='जेजुरी पावनखिंड')
    latitude = models.FloatField(default=18.3444)
    longitude = models.FloatField(default=74.0305)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='LIVE')
    distance_covered_km = models.FloatField(default=68.5)
    total_distance_km = models.FloatField(default=245.0)
    eta_next_stop = models.CharField(max_length=50, default='2 hrs 15 mins')
    schedule_status = models.CharField(max_length=100, default='12.4 km ahead of schedule')
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.palkhi_name} - {self.current_stop} ({self.status})"


class EmergencyAlert(models.Model):
    ALERT_TYPES = (
        ('MEDICAL', 'Medical Emergency / रुग्णवाहिका'),
        ('LOST_PERSON', 'Lost Person / हरवलेली व्यक्ती'),
        ('CROWD_DENSITY', 'Crowd Stampede Risk / गर्दी नियंत्रण'),
        ('ACCIDENT', 'Road Accident / अपघात'),
        ('GENERAL', 'Urgent Assistance / मदत हवी आहे'),
    )

    STATUS_CHOICES = (
        ('PENDING', 'Pending Dispatch'),
        ('DISPATCHED', 'Rescue Unit Dispatched'),
        ('RESOLVED', 'Resolved'),
    )

    PRIORITY_CHOICES = (
        ('CRITICAL', 'Critical'),
        ('HIGH', 'High'),
        ('MEDIUM', 'Medium'),
    )

    alert_type = models.CharField(max_length=30, choices=ALERT_TYPES, default='MEDICAL')
    caller_name = models.CharField(max_length=150)
    caller_phone = models.CharField(max_length=20)
    location_name = models.CharField(max_length=200)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='HIGH')
    dispatched_unit = models.CharField(max_length=150, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.priority}] {self.alert_type} - {self.caller_name} ({self.status})"


class SevaResource(models.Model):
    CATEGORY_CHOICES = (
        ('MEDICAL', 'Medical Camp & Ambulance'),
        ('WATER', 'Clean Drinking Water Point'),
        ('FOOD', 'Annachatra / Mahaprasad'),
        ('SHELTER', 'Night Shelter & Tent Ground'),
        ('SANITATION', 'Mobile Toilets & Sanitation'),
    )

    name = models.CharField(max_length=150)
    name_mr = models.CharField(max_length=150, blank=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='WATER')
    location_name = models.CharField(max_length=200)
    distance_meters = models.IntegerField(default=350)
    contact_number = models.CharField(max_length=30, default='108')
    is_active = models.BooleanField(default=True)
    capacity_or_supplies = models.CharField(max_length=150, default='Full Stock / Open')
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.category}) - {self.location_name}"


class CrowdDensity(models.Model):
    LEVEL_CHOICES = (
        ('NORMAL', 'Level 1: Normal Flow (सुरळीत)'),
        ('MODERATE', 'Level 2: Moderate Crowd (मध्यम)'),
        ('HEAVY', 'Level 3: Heavy Congestion (दाट गर्दी)'),
        ('CRITICAL', 'Level 4: Bottleneck Warning (गंभीर)'),
    )

    location_name = models.CharField(max_length=150, default='Ringan Ground')
    density_level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='NORMAL')
    flow_speed = models.CharField(max_length=100, default='Smooth flow (4.0 km/h)')
    recommended_action = models.CharField(max_length=200, default='Normal pilgrim movement. Maintain discipline in Dindi lines.')
    active_volunteers_count = models.IntegerField(default=24)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.location_name}: {self.density_level}"
