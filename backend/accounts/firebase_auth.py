"""Firebase Admin & Google ID token verification."""

import os
import logging
from django.conf import settings
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
import firebase_admin
from firebase_admin import auth, credentials

logger = logging.getLogger(__name__)


class FirebaseConfigurationError(RuntimeError):
    """Raised when Firebase Admin credentials/project are not configured."""


def _get_app():
    if not settings.FIREBASE_PROJECT_ID:
        raise FirebaseConfigurationError('FIREBASE_PROJECT_ID is not configured.')
    try:
        return firebase_admin.get_app()
    except ValueError:
        cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', '') or ''
        if cred_path:
            cred_path = os.path.normpath(cred_path)

        if cred_path and os.path.isfile(cred_path):
            cred = credentials.Certificate(cred_path)
            return firebase_admin.initialize_app(
                cred,
                {'projectId': settings.FIREBASE_PROJECT_ID},
            )
        return None


def verify_id_token(id_token_str: str) -> dict:
    """Verify a Firebase ID token using Google public certificates or Firebase Admin."""
    if not id_token_str:
        raise ValueError('A Firebase ID token is required.')

    # 1. Primary: Verify using Google's public x509 certs (works reliably without service-account credentials!)
    try:
        request_adapter = google_requests.Request()
        claims = google_id_token.verify_firebase_token(
            id_token_str,
            request_adapter,
            audience=settings.FIREBASE_PROJECT_ID
        )
        if claims:
            return claims
    except Exception as exc:
        logger.info('Public cert token verification note: %s', exc)

    # 2. Secondary: Verify using Firebase Admin SDK if service account certificate exists
    try:
        app = _get_app()
        if app:
            return auth.verify_id_token(id_token_str, app=app, check_revoked=True)
    except Exception as exc:
        logger.warning('Firebase Admin SDK verification note: %s', exc)

    raise ValueError('Firebase ID token is invalid or expired.')

