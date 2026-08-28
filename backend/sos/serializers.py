from rest_framework import serializers
from .models import SOSReport

class SOSReportSerializer(serializers.ModelSerializer):
    reported_by = serializers.CharField(source='reporter.username', read_only=True)
    reported_to = serializers.CharField(source='admin.username', read_only=True, default=None)
    reporter_name = serializers.CharField(source='reporter.username', read_only=True)
    admin_name = serializers.CharField(source='admin.username', read_only=True, default=None)
    reporter_mobile = serializers.CharField(source='reporter.profile.mobile_number', read_only=True, default=None)
    admin_mobile = serializers.CharField(source='admin.profile.mobile_number', read_only=True, default=None)
    
    class Meta:
        model = SOSReport
        fields = [
            'id', 'type', 'description', 'lat', 'lng', 'status', 'admin_reply', 
            'created_at', 'reported_by', 'reported_to', 'reporter_name', 
            'admin_name', 'reporter_mobile', 'admin_mobile'
        ]


class SOSReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SOSReport
        fields = ['type', 'description', 'lat', 'lng']

    def validate(self, data):
        if data.get('type') == 'lost_item' and not data.get('description'):
            raise serializers.ValidationError({"description": "Description is required for lost item reports."})
        return data
