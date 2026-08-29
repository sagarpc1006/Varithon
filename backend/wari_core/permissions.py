from rest_framework.permissions import IsAuthenticated


class IsAdminUser(IsAuthenticated):
    """Allow access only to users whose profile role is 'admin'.
    Shared by sos and alerts apps.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == 'admin'
        )
