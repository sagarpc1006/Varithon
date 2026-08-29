from django.urls import path
from .views import (
    ZoneDensityListView,
    ZoneCapacityDetailView,
    ZoneHistoryView,
    ZoneResourcesView,
    ZoneDeployView,
    CrowdAlertsListView,
    CrowdSummaryView,
    SimulateTickView
)

urlpatterns = [
    # Top-level summary KPIs
    path('summary/', CrowdSummaryView.as_view(), name='crowd-summary'),

    # Zones density & details
    path('zones/', ZoneDensityListView.as_view(), name='zone-density-list'),
    path('zones/density/', ZoneDensityListView.as_view(), name='zone-density-list-alias'),
    path('zones/<int:pk>/capacity/', ZoneCapacityDetailView.as_view(), name='zone-capacity-detail'),
    path('zones/<int:pk>/history/', ZoneHistoryView.as_view(), name='zone-history'),
    path('zones/<int:pk>/resources/', ZoneResourcesView.as_view(), name='zone-resources'),
    path('zones/<int:pk>/deploy/', ZoneDeployView.as_view(), name='zone-deploy'),

    # Active alerts
    path('alerts/threshold/', CrowdAlertsListView.as_view(), name='crowd-alerts-threshold'),

    # Simulation tick
    path('simulate-tick/', SimulateTickView.as_view(), name='crowd-simulate-tick'),
]
