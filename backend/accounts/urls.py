from django.urls import path
from .views import (
    LoginView,
    RegisterView,
    GoogleAuthView,
    ForgotPasswordView,
    ResetPasswordView,
    MeView,
    LogoutView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('google/', GoogleAuthView.as_view(), name='auth-google'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
]
