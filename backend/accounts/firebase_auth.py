"""Firebase Admin token verification, initialized lazily for Django."""

import os
from django.conf import settings
import firebase_admin
from firebase_admin import auth, credentials


class FirebaseConfigurationError(RuntimeError):
    """Raised when Firebase Admin credentials/project are not configured."""


def _get_app():
    if not settings.FIREBASE_PROJECT_ID:
        raise FirebaseConfigurationError('FIREBASE_PROJECT_ID is not configured.')
    try:
        return firebase_admin.get_app()
    except ValueError:
        # Build credentials: prefer an explicit service-account JSON file so
        # that the setup works locally without setting any OS-level env vars.
        cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', '') or ''
        # Normalise Windows paths that may have been written with backslashes.
        if cred_path:
            cred_path = os.path.normpath(cred_path)

        if cred_path and os.path.isfile(cred_path):
            cred = credentials.Certificate(cred_path)
        else:
            # Fallback: rely on Application Default Credentials (works on GCP,
            # or when GOOGLE_APPLICATION_CREDENTIALS is set at the OS level).
            cred = credentials.ApplicationDefault()

        return firebase_admin.initialize_app(
            cred,
            {'projectId': settings.FIREBASE_PROJECT_ID},
        )


def verify_id_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return trusted claims."""
    if not id_token:
        raise ValueError('A Firebase ID token is required.')
    return auth.verify_id_token(id_token, app=_get_app(), check_revoked=True)
