from rest_framework.authentication import SessionAuthentication
from django.contrib.auth.models import User
from django.db.models import Q
from accounts.models import UserProfile


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication subclass that skips CSRF enforcement and supports
    custom session fallback headers (X-User-Id / X-User-Identifier) so that
    SPAs with stored localStorage sessions can seamlessly authenticate.
    """
    def enforce_csrf(self, request):
        return  # Skip CSRF check

    def authenticate(self, request):
        # 1. Try standard Django Session Authentication
        auth_result = super().authenticate(request)
        if auth_result is not None:
            return auth_result

        # 2. Fallback to header-based user resolution from frontend localStorage session
        user_id = request.headers.get('X-User-Id')
        user_identifier = request.headers.get('X-User-Identifier')
        user_role = request.headers.get('X-User-Role', 'pilgrim')

        user = None
        if user_id and str(user_id).isdigit():
            user = User.objects.filter(id=int(user_id)).first()

        if not user and user_identifier:
            user_identifier = user_identifier.strip()
            user = User.objects.filter(
                Q(username__iexact=user_identifier) | Q(email__iexact=user_identifier)
            ).first()

            if not user:
                profile = UserProfile.objects.filter(mobile_number=user_identifier).first()
                if profile:
                    user = profile.user

            # If user still not found, create demo/dev user on the fly so testing is smooth
            if not user and user_identifier:
                clean_name = user_identifier.replace('@', '_').replace('.', '_')
                uname = f"{user_role}_{clean_name}"
                user, _ = User.objects.get_or_create(
                    username=uname,
                    defaults={
                        'email': user_identifier if '@' in user_identifier else f"{clean_name}@varimitra.org",
                        'first_name': user_identifier
                    }
                )
                UserProfile.objects.get_or_create(
                    user=user,
                    defaults={'role': user_role, 'mobile_number': user_identifier if not '@' in user_identifier else ''}
                )

        if user:
            return (user, None)

        return None

