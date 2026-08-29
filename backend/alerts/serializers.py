from rest_framework import serializers
from .models import Alert


class AlertSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = [
            'id', 'type', 'title', 'message',
            'zone_lat', 'zone_lng', 'radius_km',
            'created_by_name', 'created_at',
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return 'System'


class AlertCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['type', 'title', 'message', 'zone_lat', 'zone_lng', 'radius_km']

    def validate(self, data):
        if data.get('type') in ('weather_alert', 'route_change'):
            missing = [
                f for f in ('zone_lat', 'zone_lng', 'radius_km')
                if not data.get(f)
            ]
            if missing:
                raise serializers.ValidationError(
                    f'zone_lat, zone_lng, and radius_km are required for {data["type"]}.'
                )
        return data
