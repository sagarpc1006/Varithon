from django.urls import path
from .views import (
    PalkhiLocationView,
    EmergencyAlertView,
    SevaResourceListView,
    CrowdDensityView,
    AIChatView,
    DashboardOverviewView,
)

urlpatterns = [
    path('maps/palkhi/', PalkhiLocationView.as_view(), name='palkhi-location'),
    path('sos/', EmergencyAlertView.as_view(), name='emergency-sos'),
    path('resources/', SevaResourceListView.as_view(), name='seva-resources'),
    path('crowdflow/', CrowdDensityView.as_view(), name='crowd-density'),
    path('ai/chat/', AIChatView.as_view(), name='ai-chat'),
    path('dashboard/overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
]
