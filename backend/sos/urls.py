from django.urls import path
from .views import SOSReportCreateView, SOSNearbyView, SOSMyReportsView, SOSReplyView, SOSStatusView

urlpatterns = [
    path('report/', SOSReportCreateView.as_view(), name='sos-report'),
    path('nearby/', SOSNearbyView.as_view(), name='sos-nearby'),
    path('my-reports/', SOSMyReportsView.as_view(), name='sos-my-reports'),
    path('<int:id>/reply/', SOSReplyView.as_view(), name='sos-reply'),
    path('<int:id>/status/', SOSStatusView.as_view(), name='sos-status'),
]
