from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication subclass that skips CSRF enforcement for REST API calls
    made by single-page frontend applications using Django session cookies.
    """
    def enforce_csrf(self, request):
        return  # Skip CSRF check for API endpoints
