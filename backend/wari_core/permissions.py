from rest_framework.permissions import IsAuthenticated


class IsAdminUser(IsAuthenticated):
    """Allow access to users whose profile role is 'admin' or 'volunteer', or staff."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        return bool(
            hasattr(request.user, 'profile')
            and request.user.profile.role in ['admin', 'volunteer']
        )
