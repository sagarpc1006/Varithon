import logging
import random
import secrets
from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions

from .models import UserProfile
from .firebase_auth import verify_id_token

logger = logging.getLogger(__name__)


class FirebaseAuthentication(BaseAuthentication):
    """
    DRF Authentication class for Firebase ID Tokens.
    Expects header:
        Authorization: Bearer <FIREBASE_ID_TOKEN>
    """

    def authenticate_header(self, request):
        return 'Bearer realm="api"'

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization') or request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) == 0:
            return None

        if parts[0].lower() != 'bearer':
            return None

        if len(parts) == 1:
            raise exceptions.AuthenticationFailed('Invalid Bearer header: token missing.')
        elif len(parts) > 2:
            raise exceptions.AuthenticationFailed('Invalid Bearer header: token format corrupted.')

        id_token_str = parts[1].strip()
        if not id_token_str:
            raise exceptions.AuthenticationFailed('Empty Firebase ID token provided.')

        try:
            claims = verify_id_token(id_token_str)
        except ValueError as exc:
            logger.warning('Firebase token verification rejected: %s', exc)
            raise exceptions.AuthenticationFailed(str(exc))
        except Exception as exc:
            logger.warning('Firebase token verification error: %s', exc)
            raise exceptions.AuthenticationFailed('Invalid or expired Firebase ID token.')

        uid = (claims.get('uid') or claims.get('sub') or '').strip()
        if not uid:
            raise exceptions.AuthenticationFailed('Firebase token does not contain a valid UID.')

        email = (claims.get('email') or '').strip().lower()
        name = (claims.get('name') or claims.get('display_name') or '').strip()
        phone_number = (claims.get('phone_number') or '').strip()
        if not phone_number and email.endswith('@varimitra.org'):
            possible_phone = email.split('@')[0]
            if possible_phone.isdigit() and len(possible_phone) >= 10:
                phone_number = possible_phone

        # Step A: Resolve by firebase_uid first
        profile = UserProfile.objects.filter(firebase_uid=uid).select_related('user').first()
        user = None
        if profile:
            user = profile.user
        elif email:
            # Step B: Resolve by verified email
            user = User.objects.filter(email__iexact=email).first()
            if user:
                profile, _ = UserProfile.objects.get_or_create(user=user)
                if not profile.firebase_uid:
                    profile.firebase_uid = uid
                    profile.save(update_fields=['firebase_uid'])

        # Step C: If still not found, auto-provision user safely as pilgrim
        if not user:
            clean_email = email.split('@')[0].replace('.', '_').replace('+', '') if email else uid[:10]
            username = f"fb_pilgrim_{clean_email}_{random.randint(100, 999)}"
            parts = name.split(' ', 1) if name else [clean_email, '']
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ''

            user = User.objects.create_user(
                username=username,
                email=email or f"{uid}@varimitra.org",
                first_name=first_name,
                last_name=last_name,
                password=secrets.token_urlsafe(24)
            )
            profile = UserProfile.objects.create(
                user=user,
                firebase_uid=uid,
                role='pilgrim',
                mobile_number=phone_number if phone_number else None,
                organization='Warkari Devotee',
                approval_status='approved',
                is_approved=True,
            )
        else:
            if profile and phone_number and not profile.mobile_number:
                profile.mobile_number = phone_number
                profile.save(update_fields=['mobile_number'])

            if profile and profile.role == 'admin' and not user.is_staff:
                user.is_staff = True
                user.save(update_fields=['is_staff'])

        return (user, claims)
