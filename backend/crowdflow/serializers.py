from rest_framework import serializers
from .models import Zone, CrowdDensityReading, ZoneCapacityStatus, CrowdAlert, VolunteerDeployment

class ZoneDensitySerializer(serializers.ModelSerializer):
    person_count = serializers.SerializerMethodField()
    density_level = serializers.SerializerMethodField()
    risk_score = serializers.SerializerMethodField()
    current_status = serializers.SerializerMethodField()
    movement_direction = serializers.SerializerMethodField()
    movement_speed_kmh = serializers.SerializerMethodField()
    trend = serializers.SerializerMethodField()

    class Meta:
        model = Zone
        fields = [
            'id', 'name', 'name_mr', 'latitude', 'longitude', 'boundary_geojson',
            'max_safe_capacity', 'person_count', 'density_level', 'risk_score',
            'current_status', 'movement_direction', 'movement_speed_kmh', 'trend'
        ]

    def get_capacity_status(self, obj):
        if not hasattr(obj, '_cached_status'):
            obj._cached_status = getattr(obj, 'capacity_status', None)
        return obj._cached_status

    def get_latest_reading(self, obj):
        if not hasattr(obj, '_cached_reading'):
            obj._cached_reading = obj.density_readings.first()
        return obj._cached_reading

    def get_person_count(self, obj):
        r = self.get_latest_reading(obj)
        return r.person_count if r else 0

    def get_density_level(self, obj):
        r = self.get_latest_reading(obj)
        return r.density_level if r else 'low'

    def get_risk_score(self, obj):
        s = self.get_capacity_status(obj)
        return s.risk_score if s else 15

    def get_current_status(self, obj):
        s = self.get_capacity_status(obj)
        return s.current_status if s else 'low'

    def get_movement_direction(self, obj):
        s = self.get_capacity_status(obj)
        return s.movement_direction if s else 'Forward'

    def get_movement_speed_kmh(self, obj):
        s = self.get_capacity_status(obj)
        return s.movement_speed_kmh if s else 3.5

    def get_trend(self, obj):
        s = self.get_capacity_status(obj)
        return s.trend if s else 'stable'


class ZoneCapacityDetailSerializer(serializers.ModelSerializer):
    zone_id = serializers.IntegerField(source='zone.id')
    zone_name = serializers.CharField(source='zone.name')
    zone_name_mr = serializers.CharField(source='zone.name_mr')
    latitude = serializers.FloatField(source='zone.latitude')
    longitude = serializers.FloatField(source='zone.longitude')
    max_safe_capacity = serializers.IntegerField(source='zone.max_safe_capacity')
    person_count = serializers.SerializerMethodField()
    density_level = serializers.SerializerMethodField()

    class Meta:
        model = ZoneCapacityStatus
        fields = [
            'id', 'zone_id', 'zone_name', 'zone_name_mr', 'latitude', 'longitude',
            'max_safe_capacity', 'person_count', 'density_level', 'current_status',
            'risk_score', 'movement_direction', 'movement_speed_kmh', 'trend',
            'last_breach_at', 'updated_at'
        ]

    def get_person_count(self, obj):
        latest = obj.zone.density_readings.first()
        return latest.person_count if latest else 0

    def get_density_level(self, obj):
        latest = obj.zone.density_readings.first()
        return latest.density_level if latest else obj.current_status


class CrowdDensityReadingSerializer(serializers.ModelSerializer):
    time_label = serializers.SerializerMethodField()

    class Meta:
        model = CrowdDensityReading
        fields = ['id', 'person_count', 'density_level', 'source', 'recorded_at', 'time_label']

    def get_time_label(self, obj):
        return obj.recorded_at.strftime('%H:%M')


class CrowdAlertSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    latitude = serializers.FloatField(source='zone.latitude', read_only=True)
    longitude = serializers.FloatField(source='zone.longitude', read_only=True)

    class Meta:
        model = CrowdAlert
        fields = [
            'id', 'zone', 'zone_name', 'latitude', 'longitude', 'title',
            'description', 'risk_score', 'risk_level', 'action_type',
            'is_resolved', 'created_at'
        ]


class VolunteerDeploymentSerializer(serializers.ModelSerializer):
    zone_name = serializers.CharField(source='zone.name', read_only=True)

    class Meta:
        model = VolunteerDeployment
        fields = ['id', 'zone', 'zone_name', 'volunteer_count', 'status', 'notes', 'deployed_at']
