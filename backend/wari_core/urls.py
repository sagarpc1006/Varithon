from django.urls import path
from .views import (
    PalkhiLocationView,
    EmergencyAlertView,
    SevaResourceListView,
    CrowdDensityView,
    AIChatView,
    DashboardOverviewView,
    WariLocationsView,
    NearbyResourceListCreateView,
    NearbyResourceDeleteView,
    WariWeatherView,
    GroupListView,
    GroupDetailView,
    GroupJoinLeaveView,
    GroupMessageListView,
    GroupAnnouncementView,
    GroupMessageActionView,
    GroupMessageReportView,
    GroupMemberListView,
    GroupMemberManageView,
    AdminGroupStatsView,
    AdminReportsListView,
)

urlpatterns = [
    # Existing Telemetry & SOS
    path('maps/palkhi/', PalkhiLocationView.as_view(), name='palkhi-location'),
    path('sos/', EmergencyAlertView.as_view(), name='emergency-sos'),
    path('resources/', SevaResourceListView.as_view(), name='seva-resources'),
    path('crowdflow/', CrowdDensityView.as_view(), name='crowd-density'),
    path('ai/chat/', AIChatView.as_view(), name='ai-chat'),
    path('dashboard/overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('wari-2025/', WariLocationsView.as_view(), name='wari-locations'),
    path('weather/', WariWeatherView.as_view(), name='wari-weather'),

    # Nearby Resources (admin add/remove, user read)
    path('nearby-resources/', NearbyResourceListCreateView.as_view(), name='nearby-resources'),
    path('nearby-resources/<int:pk>/', NearbyResourceDeleteView.as_view(), name='nearby-resource-delete'),

    # Groups & Communication
    path('groups/', GroupListView.as_view(), name='group-list-create'),
    path('groups/<int:pk>/', GroupDetailView.as_view(), name='group-detail'),
    path('groups/<int:pk>/join/', GroupJoinLeaveView.as_view(), name='group-join-leave'),
    path('groups/<int:pk>/messages/', GroupMessageListView.as_view(), name='group-messages'),
    path('groups/<int:pk>/announcements/', GroupAnnouncementView.as_view(), name='group-announcements'),
    path('groups/<int:pk>/messages/<int:msg_id>/', GroupMessageActionView.as_view(), name='group-message-action'),
    path('groups/<int:pk>/messages/<int:msg_id>/report/', GroupMessageReportView.as_view(), name='group-message-report'),
    path('groups/<int:pk>/members/', GroupMemberListView.as_view(), name='group-members'),
    path('groups/<int:pk>/members/<int:user_id>/', GroupMemberManageView.as_view(), name='group-member-manage'),

    # Admin Management & Moderation
    path('admin/groups/stats/', AdminGroupStatsView.as_view(), name='admin-group-stats'),
    path('admin/groups/reports/', AdminReportsListView.as_view(), name='admin-reports-list'),
    path('admin/groups/reports/<int:report_id>/', AdminReportsListView.as_view(), name='admin-report-resolve'),
]

