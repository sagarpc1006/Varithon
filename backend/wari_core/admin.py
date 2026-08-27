from django.contrib import admin
from .models import PalkhiLocation, EmergencyAlert, SevaResource, CrowdDensity

@admin.register(PalkhiLocation)
class PalkhiLocationAdmin(admin.ModelAdmin):
    list_display = ('palkhi_name', 'current_stop', 'next_stop', 'status', 'distance_covered_km', 'schedule_status', 'updated_at')
    list_filter = ('status', 'is_active')

@admin.register(EmergencyAlert)
class EmergencyAlertAdmin(admin.ModelAdmin):
    list_display = ('alert_type', 'caller_name', 'caller_phone', 'priority', 'status', 'dispatched_unit', 'created_at')
    list_filter = ('alert_type', 'priority', 'status')
    search_fields = ('caller_name', 'caller_phone', 'location_name', 'description')

@admin.register(SevaResource)
class SevaResourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'location_name', 'distance_meters', 'contact_number', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'location_name')

@admin.register(CrowdDensity)
class CrowdDensityAdmin(admin.ModelAdmin):
    list_display = ('location_name', 'density_level', 'flow_speed', 'active_volunteers_count', 'updated_at')
    list_filter = ('density_level',)
