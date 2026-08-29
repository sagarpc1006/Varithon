from rest_framework.permissions import IsAuthenticated


class IsAdminUser(IsAuthenticated):
    """Allow access only to users whose profile role is 'admin'.
    Shared by sos and alerts apps.
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        return bool(
            hasattr(request.user, 'profile')
            and request.user.profile.role == 'admin'
        )
