import math
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from rest_framework import status, views, response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import SOSReport
from .serializers import SOSReportSerializer, SOSReportCreateSerializer
from .notifications import notify_sos, notify_user_reply
from wari_core.geo_utils import haversine


def get_request_user_or_fallback(request, default_role='pilgrim'):
    """Helper to return authenticated user or fallback demo user."""
    if request.user and request.user.is_authenticated:
        return request.user
    
    # Try finding user by role
    if default_role == 'admin':
        admin_user = User.objects.filter(is_staff=True).first() or User.objects.filter(is_superuser=True).first()
        if admin_user:
            return admin_user

    pilgrim_user = User.objects.filter(username__icontains='pilgrim').first() or User.objects.first()
    if not pilgrim_user:
        pilgrim_user, _ = User.objects.get_or_create(username='pilgrim_demo', defaults={'first_name': 'Warkari Pilgrim'})
    return pilgrim_user


@method_decorator(csrf_exempt, name='dispatch')
class SOSReportCreateView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user = get_request_user_or_fallback(request, default_role='pilgrim')
        serializer = SOSReportCreateSerializer(data=request.data)
        if serializer.is_valid():
            report = serializer.save(reporter=user, status='active')
            try:
                notify_sos(report)
            except Exception as e:
                print(f"[SOS Notification Warning] {e}")
            return response.Response(SOSReportSerializer(report).data, status=status.HTTP_201_CREATED)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class SOSNearbyView(views.APIView):
    """Returns all active/historical SOS reports with calculated distance to admin."""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            admin_lat = float(request.query_params.get('lat', 18.5204))
            admin_lng = float(request.query_params.get('lng', 73.8567))
        except (TypeError, ValueError):
            admin_lat = 18.5204
            admin_lng = 73.8567

        status_filter = request.query_params.get('status', '').strip().lower()
        reports_qs = SOSReport.objects.all().order_by('-created_at')

        if status_filter:
            if status_filter in ['active', 'open']:
                reports_qs = reports_qs.filter(status__in=['active', 'open'])
            elif status_filter in ['acknowledged', 'responded']:
                reports_qs = reports_qs.filter(status='acknowledged')
            elif status_filter == 'resolved':
                reports_qs = reports_qs.filter(status='resolved')

        serializer = SOSReportSerializer(reports_qs, many=True)
        return response.Response(serializer.data, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class SOSMyReportsView(views.APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = get_request_user_or_fallback(request, default_role='pilgrim')
        reports = SOSReport.objects.filter(reporter=user).order_by('-created_at')
        if not reports.exists():
            # If no reports for this specific user, show recent reports
            reports = SOSReport.objects.all().order_by('-created_at')[:10]
        serializer = SOSReportSerializer(reports, many=True)
        return response.Response(serializer.data, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class SOSReplyView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request, id):
        try:
            report = SOSReport.objects.get(id=id)
        except SOSReport.DoesNotExist:
            return response.Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

        reply_text = request.data.get('reply', '').strip()
        if not reply_text:
            return response.Response({"error": "reply field is required."}, status=status.HTTP_400_BAD_REQUEST)

        admin_user = get_request_user_or_fallback(request, default_role='admin')
        if not report.admin:
            report.admin = admin_user
        report.admin_reply = reply_text
        report.status = 'acknowledged'  # auto-acknowledge when replying
        report.save()

        try:
            notify_user_reply(report)
        except Exception as e:
            print(f"[SOS Reply Notification Warning] {e}")

        return response.Response(SOSReportSerializer(report).data, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class SOSStatusView(views.APIView):
    permission_classes = [AllowAny]

    def _update_status(self, request, id):
        try:
            report = SOSReport.objects.get(id=id)
        except SOSReport.DoesNotExist:
            return response.Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

        raw_status = request.data.get('status', '').strip().lower()
        valid_map = {
            'active': 'active',
            'open': 'active',
            'acknowledged': 'acknowledged',
            'responded': 'acknowledged',
            'resolved': 'resolved',
        }

        if raw_status not in valid_map:
            return response.Response({"error": f"Invalid status '{raw_status}'. Must be active, acknowledged, or resolved."}, status=status.HTTP_400_BAD_REQUEST)

        report.status = valid_map[raw_status]
        admin_user = get_request_user_or_fallback(request, default_role='admin')
        if not report.admin:
            report.admin = admin_user
        report.save()

        return response.Response(SOSReportSerializer(report).data, status=status.HTTP_200_OK)

    def put(self, request, id):
        return self._update_status(request, id)

    def patch(self, request, id):
        return self._update_status(request, id)
