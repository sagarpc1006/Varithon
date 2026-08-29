from django.urls import path
from .views import AlertBroadcastView, AlertFeedView

urlpatterns = [
    path('feed', AlertFeedView.as_view(), name='alert-feed'),
    path('broadcast', AlertBroadcastView.as_view(), name='alert-broadcast'),
]
