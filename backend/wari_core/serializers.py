from rest_framework import serializers
from .models import PalkhiLocation, EmergencyAlert, SevaResource, CrowdDensity

class PalkhiLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PalkhiLocation
        fields = '__all__'


class EmergencyAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyAlert
        fields = '__all__'
        read_only_fields = ['id', 'status', 'created_at', 'resolved_at', 'dispatched_unit']


class SevaResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SevaResource
        fields = '__all__'


class CrowdDensitySerializer(serializers.ModelSerializer):
    class Meta:
        model = CrowdDensity
        fields = '__all__'


class AIChatQuerySerializer(serializers.Serializer):
    message = serializers.CharField(required=True)
    language = serializers.ChoiceField(choices=['en', 'mr', 'hi'], default='en')
    user_name = serializers.CharField(required=False, allow_blank=True, default='')
