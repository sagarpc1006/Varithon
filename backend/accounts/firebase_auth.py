"""Firebase Admin token verification, initialized lazily for Django."""

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
        return firebase_admin.initialize_app(
            credentials.ApplicationDefault(),
            {'projectId': settings.FIREBASE_PROJECT_ID},
        )


def verify_id_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return trusted claims."""
    if not id_token:
        raise ValueError('A Firebase ID token is required.')
    return auth.verify_id_token(id_token, app=_get_app(), check_revoked=True)
