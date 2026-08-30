import math
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, views, response
from .models import SOSReport
from .serializers import SOSReportSerializer, SOSReportCreateSerializer
from .notifications import notify_sos, notify_user_reply
from wari_core.geo_utils import haversine
from wari_core.permissions import IsAdminUser
from rest_framework.permissions import IsAuthenticated

@method_decorator(csrf_exempt, name='dispatch')
class SOSReportCreateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SOSReportCreateSerializer(data=request.data)
        if serializer.is_valid():
            report = serializer.save(reporter=request.user)
            notify_sos(report)
            return response.Response(SOSReportSerializer(report).data, status=status.HTTP_201_CREATED)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SOSNearbyView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            admin_lat = float(request.query_params.get('lat'))
            admin_lng = float(request.query_params.get('lng'))
        except (TypeError, ValueError):
            return response.Response({"error": "Valid lat and lng query parameters are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        radius_km = float(request.query_params.get('radius', 2.0))
        
        # Bounding box filter first for performance (approximate 1 deg = 111 km)
        lat_delta = radius_km / 111.0
        lng_delta = radius_km / (111.0 * math.cos(math.radians(admin_lat)))
        
        nearby_reports_qs = SOSReport.objects.filter(
            lat__gte=admin_lat - lat_delta, lat__lte=admin_lat + lat_delta,
            lng__gte=admin_lng - lng_delta, lng__lte=admin_lng + lng_delta
        ).order_by('-created_at')

        nearby_reports = []
        for report in nearby_reports_qs:
            dist = haversine(admin_lat, admin_lng, report.lat, report.lng)
            if dist <= radius_km:
                nearby_reports.append(report)
                
        # To maintain serialization of querysets properly
        serializer = SOSReportSerializer(nearby_reports, many=True)
        return response.Response(serializer.data, status=status.HTTP_200_OK)

class SOSMyReportsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = SOSReport.objects.filter(reporter=request.user).order_by('-created_at')
        serializer = SOSReportSerializer(reports, many=True)
        return response.Response(serializer.data, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class SOSReplyView(views.APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        try:
            report = SOSReport.objects.get(id=id)
        except SOSReport.DoesNotExist:
            return response.Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)
            
        reply_text = request.data.get('reply')
        if not reply_text:
            return response.Response({"error": "reply field is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Assign admin if not already set
        if not report.admin:
            report.admin = request.user
        report.admin_reply = reply_text
        report.status = 'acknowledged'  # auto-acknowledge when replying
        report.save()
        notify_user_reply(report)
        
        return response.Response(SOSReportSerializer(report).data, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class SOSStatusView(views.APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, id):
        try:
            report = SOSReport.objects.get(id=id)
        except SOSReport.DoesNotExist:
            return response.Response({"error": "Report not found."}, status=status.HTTP_404_NOT_FOUND)
            
        new_status = request.data.get('status')
        if new_status not in dict(SOSReport.STATUS_CHOICES).keys():
            return response.Response({"error": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
            
        report.status = new_status
        report.save()
        
        return response.Response(SOSReportSerializer(report).data, status=status.HTTP_200_OK)

    def put(self, request, id):
        return self.patch(request, id)
