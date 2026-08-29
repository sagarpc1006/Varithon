from datetime import timedelta

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import response, status, views
from rest_framework.permissions import IsAuthenticated

from wari_core.geo_utils import haversine
from wari_core.permissions import IsAdminUser

from .models import Alert
from .notifications import notify_alert
from .serializers import AlertCreateSerializer, AlertSerializer


@method_decorator(csrf_exempt, name='dispatch')
class AlertFeedView(views.APIView):
    """GET /api/alerts/feed  — user-facing polling endpoint.

    Query params:
        since  ISO datetime — only return alerts newer than this (delta poll)
        lat    float        — user latitude  (for location-based filtering)
        lng    float        — user longitude (for location-based filtering)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        since_str = request.query_params.get('since')
        lat_str = request.query_params.get('lat')
        lng_str = request.query_params.get('lng')

        # Base queryset — last 24 h or delta since last poll
        qs = Alert.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        )
        if since_str:
            clean_since_str = since_str.replace(' ', '+')
            since_dt = parse_datetime(clean_since_str) or parse_datetime(since_str)
            if since_dt:
                if timezone.is_naive(since_dt):
                    since_dt = timezone.make_aware(since_dt)
                qs = qs.filter(created_at__gt=since_dt)

        user_lat = float(lat_str) if lat_str else None
        user_lng = float(lng_str) if lng_str else None

        visible = []
        for alert in qs:
            if alert.type == 'announcement':
                visible.append(alert)
            elif user_lat is not None and user_lng is not None:
                dist = haversine(user_lat, user_lng, alert.zone_lat, alert.zone_lng)
                if dist <= alert.radius_km:
                    visible.append(alert)

        return response.Response(AlertSerializer(visible, many=True).data)


@method_decorator(csrf_exempt, name='dispatch')
class AlertBroadcastView(views.APIView):
    """POST /api/alerts/broadcast — admin broadcast.
    GET  /api/alerts/broadcast — admin history list.
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        ser = AlertCreateSerializer(data=request.data)
        if not ser.is_valid():
            return response.Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        alert = ser.save(created_by=request.user)
        notify_alert(alert)
        return response.Response(
            AlertSerializer(alert).data, status=status.HTTP_201_CREATED
        )

    def get(self, request):
        qs = Alert.objects.all()
        return response.Response(AlertSerializer(qs, many=True).data)
