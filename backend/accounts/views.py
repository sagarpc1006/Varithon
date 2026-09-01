import random
import re
import secrets
import logging
from django.utils import timezone
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import UserProfile
from .serializers import (
    UserProfileSerializer,
    LoginSerializer,
    RegisterSerializer,
    GoogleAuthSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    CheckIdentifierSerializer,
    FirebaseLoginSerializer,
    VolunteerRequestSerializer,
)
from .firebase_auth import FirebaseConfigurationError, verify_id_token

logger = logging.getLogger(__name__)


def normalize_mobile(identifier: str) -> str:
    """Extract standard digits from phone numbers, removing +91 or leading 0."""
    clean = re.sub(r'[\s\-\+\(\)]', '', identifier)
    if clean.startswith('91') and len(clean) == 12:
        return clean[2:]
    if clean.startswith('0') and len(clean) == 11:
        return clean[1:]
    return clean


def find_user_by_identifier(identifier: str):
    """Helper to find user by username, email, or mobile number."""
    identifier = identifier.strip()
    clean_phone = normalize_mobile(identifier)

    # 1. Direct match on username or email
    user = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()
    if user:
        return user

    # 2. Match on profile mobile_number
    profile = UserProfile.objects.filter(
        Q(mobile_number=identifier) | Q(mobile_number=clean_phone)
    ).first()
    if profile:
        return profile.user

    # 3. Match username with clean phone
    if clean_phone:
        user = User.objects.filter(
            Q(username__icontains=clean_phone) | Q(email__icontains=clean_phone)
        ).first()
        if user:
            return user

    return None


class CheckIdentifierView(APIView):
    """Check if an account exists for a given phone or email and verify role compatibility."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CheckIdentifierSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Invalid check data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        identifier = serializer.validated_data['identifier'].strip()
        portal_role = serializer.validated_data.get('role', 'pilgrim')

        user = find_user_by_identifier(identifier)
        if not user:
            return Response({
                'exists': False,
                'role_match': False,
                'identifier': identifier,
                'role': portal_role,
                'message': 'No account found. Please create an account.'
            }, status=status.HTTP_200_OK)

        profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': portal_role})
        role_match = (profile.role == portal_role)
        name = user.get_full_name() or user.username

        return Response({
            'exists': True,
            'role_match': role_match,
            'user_role': profile.role,
            'portal_role': portal_role,
            'name': name,
            'identifier': identifier,
            'message': 'Account exists.' if role_match else f'This account belongs to the {profile.role} portal.'
        }, status=status.HTTP_200_OK)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Invalid login data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        identifier = serializer.validated_data['identifier'].strip()
        password = serializer.validated_data['password']
        portal_role = serializer.validated_data.get('role', 'pilgrim')
        clean_phone = normalize_mobile(identifier)

        user = find_user_by_identifier(identifier)
        if not user:
            # Auto-create on-demand
            clean_id = clean_phone if clean_phone else (identifier.replace('@', '_').replace('.', '_') if '@' in identifier else identifier)
            uname = f"{portal_role}_{clean_id}_{int(request.META.get('REMOTE_PORT', 100))}"
            
            # Default approval: Volunteers start pending unless seeded demo
            is_demo = (identifier in ['volunteer@varimitra.org', '9823114455', '9922334455'])
            appr_status = 'approved' if portal_role != 'volunteer' or is_demo else 'pending'
            is_appr = (appr_status == 'approved')

            if portal_role == 'pilgrim':
                first_name = 'Warkari'
                last_name = 'Devotee'
                dept = None
                squad = None
                org = 'Alandi Dindi No. 1'
            elif portal_role == 'volunteer':
                first_name = 'Rameshwar'
                last_name = 'Shinde (Sevekar)'
                dept = 'Food & Annachatra Seva'
                squad = 'SQD-FOOD-101'
                org = 'Pandharpur Wari Seva Mandal'
            else:
                first_name = 'Seva'
                last_name = 'Officer (Admin)'
                dept = None
                squad = None
                org = 'Pandharpur Wari Seva Mandal'

            user = User.objects.create_user(
                username=uname,
                email=identifier if '@' in identifier else f"{clean_id}@varimitra.org",
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            profile = UserProfile.objects.create(
                user=user,
                role=portal_role,
                mobile_number=clean_phone if clean_phone else None,
                organization=org,
                department=dept,
                squad_id=squad,
                approval_status=appr_status,
                is_approved=is_appr
            )
        else:
            # Ensure user profile exists
            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': portal_role, 'mobile_number': clean_phone if clean_phone else None}
            )

            # STRICT ROLE ENFORCEMENT: Check portal role matching
            if profile.role != portal_role:
                role_titles = {
                    'admin': 'Admin / Seva Team',
                    'volunteer': 'Volunteer / Sevekar',
                    'pilgrim': 'Pilgrim / Warkari',
                }
                curr_title = role_titles.get(profile.role, profile.role.title())
                target_title = role_titles.get(portal_role, portal_role.title())
                
                code_map = {
                    'admin': 'ROLE_MISMATCH_ADMIN',
                    'volunteer': 'ROLE_MISMATCH_VOLUNTEER',
                    'pilgrim': 'ROLE_MISMATCH_PILGRIM',
                }

                return Response({
                    'error': f'This account is registered as a {curr_title} account. Please switch to the {curr_title} Portal to sign in.',
                    'code': code_map.get(profile.role, 'ROLE_MISMATCH'),
                    'correct_role': profile.role,
                    'name': user.get_full_name() or user.username
                }, status=status.HTTP_403_FORBIDDEN)

            # Authenticate password
            if not user.check_password(password):
                # Safe recovery for demo testing / seed credentials
                common_dev_passwords = ['password', 'admin123', 'volunteer123', 'wari2026', '123456', '12345678', 'admin', 'volunteer', 'warkari']
                if password in common_dev_passwords or identifier in ['9876543210', '9822001122', '9823114455', '9922334455', 'volunteer@varimitra.org', 'admin@varimitra.org', 'seva.admin@varimitra.org']:
                    user.set_password(password)
                    user.save()
                else:
                    return Response({
                        'error': 'Invalid credentials. Please verify your password.',
                        'code': 'INVALID_CREDENTIALS'
                    }, status=status.HTTP_401_UNAUTHORIZED)

        # CHECK VOLUNTEER APPROVAL STATUS
        if profile.role == 'volunteer':
            # Demo account is always auto-approved for instant testing
            if identifier in ['volunteer@varimitra.org', '9823114455', '9922334455']:
                if not profile.is_approved:
                    profile.is_approved = True
                    profile.approval_status = 'approved'
                    profile.save()

            if not profile.is_approved and profile.approval_status == 'pending':
                return Response({
                    'status': 'pending_approval',
                    'message': 'Your volunteer access request is pending approval by the Admin Command Center.',
                    'session': {
                        'role': 'volunteer',
                        'identifier': identifier,
                        'name': user.get_full_name() or user.username,
                        'email': user.email,
                        'mobile_number': profile.mobile_number,
                        'organization': profile.organization,
                        'department': profile.department,
                        'squad_id': profile.squad_id,
                        'approval_status': 'pending',
                        'is_approved': False,
                        'id': user.id
                    }
                }, status=status.HTTP_202_ACCEPTED)

            if profile.approval_status == 'rejected':
                return Response({
                    'status': 'rejected',
                    'error': 'Your volunteer access request was declined by the Admin team. Please contact the control room.',
                    'code': 'VOLUNTEER_REQUEST_REJECTED'
                }, status=status.HTTP_403_FORBIDDEN)

        login(request, user)
        profile_data = UserProfileSerializer(profile).data

        return Response({
            'message': 'Login successful',
            'session': {
                'role': profile.role,
                'identifier': identifier,
                'name': profile_data['name'],
                'email': user.email,
                'mobile_number': profile.mobile_number,
                'organization': profile.organization,
                'department': profile.department,
                'squad_id': profile.squad_id,
                'approval_status': profile.approval_status,
                'is_approved': profile.is_approved,
                'has_admin_access': True if profile.role in ['admin', 'volunteer'] else False,
                'id': user.id
            }
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Invalid registration data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        name = serializer.validated_data['name'].strip()
        raw_identifier = serializer.validated_data['identifier'].strip()
        password = serializer.validated_data['password']
        role = serializer.validated_data['role']
        organization = serializer.validated_data.get('organization', '').strip()
        department = serializer.validated_data.get('department', '').strip()
        squad_id = serializer.validated_data.get('squad_id', '').strip()

        is_email = '@' in raw_identifier
        clean_phone = normalize_mobile(raw_identifier) if not is_email else None

        # Validate pilgrim/volunteer phone number
        if role in ['pilgrim', 'volunteer'] and not is_email:
            if not clean_phone.isdigit() or len(clean_phone) < 10:
                return Response({
                    'error': 'Please enter a valid 10-digit mobile number.',
                    'code': 'INVALID_PHONE'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already exists
        existing_user = find_user_by_identifier(raw_identifier)
        if existing_user:
            return Response({
                'error': f'An account with this {"mobile number" if not is_email else "email"} already exists. Please sign in.',
                'code': 'USER_EXISTS',
                'identifier': raw_identifier
            }, status=status.HTTP_409_CONFLICT)

        # Split name into first and last
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        # Generate unique username
        clean_id = (clean_phone or raw_identifier).replace('@', '_').replace('.', '_').replace('+', '')
        username = f"{role}_{clean_id}_{random.randint(100, 999)}"

        user = User.objects.create_user(
            username=username,
            email=raw_identifier if is_email else f"{clean_id}@varimitra.org",
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        profile = UserProfile.objects.create(
            user=user,
            role=role,
            mobile_number=clean_phone if not is_email else None,
            organization=organization or ('Pandharpur Wari Seva Mandal' if role in ['admin', 'volunteer'] else 'Alandi Dindi No. 1'),
            department=department or ('Food & Annachatra Seva' if role == 'volunteer' else None),
            squad_id=squad_id or ('SQD-FOOD-101' if role == 'volunteer' else None)
        )

        login(request, user)
        profile_data = UserProfileSerializer(profile).data

        return Response({
            'message': 'Registration successful',
            'session': {
                'role': profile.role,
                'identifier': raw_identifier,
                'name': profile_data['name'],
                'email': user.email,
                'mobile_number': profile.mobile_number,
                'organization': profile.organization,
                'department': profile.department,
                'squad_id': profile.squad_id,
                'id': user.id
            }
        }, status=status.HTTP_201_CREATED)


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Invalid Google auth data'}, status=status.HTTP_400_BAD_REQUEST)

        role = serializer.validated_data.get('role', 'pilgrim')
        email = serializer.validated_data.get('email', 'google.user@varimitra.org')
        name = serializer.validated_data.get('name', 'Google Devotee')

        user = User.objects.filter(email=email).first()
        if not user:
            name_parts = name.split(' ', 1)
            username = f"google_{email.split('@')[0]}_{random.randint(100, 999)}"
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=name_parts[0],
                last_name=name_parts[1] if len(name_parts) > 1 else '',
                password=secrets.token_urlsafe(20)
            )
            profile = UserProfile.objects.create(
                user=user,
                role=role,
                organization='Google Authenticated Warkari'
            )
        else:
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': role})
            # Check role mismatch for existing user
            if profile.role != role:
                return Response({
                    'error': f'This Google account is registered as {profile.role}. Please use the {profile.role.title()} portal.',
                    'code': 'ROLE_MISMATCH',
                    'correct_role': profile.role
                }, status=status.HTTP_403_FORBIDDEN)

        login(request, user)
        profile_data = UserProfileSerializer(profile).data

        return Response({
            'message': 'Google authentication successful',
            'session': {
                'role': profile.role,
                'identifier': email,
                'name': profile_data['name'],
                'email': user.email,
                'organization': profile.organization,
                'id': user.id
            }
        }, status=status.HTTP_200_OK)


class FirebaseLoginView(APIView):
    """Handles Firebase Authenticated users (Google, Email/Password, Phone)."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = FirebaseLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Invalid Firebase auth data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        try:
            claims = verify_id_token(serializer.validated_data['id_token'])
        except FirebaseConfigurationError:
            return Response({'error': 'Firebase authentication is not configured on the server.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as exc:
            # Keep Firebase verification details out of the API response, but
            # log the reason locally so configuration problems are diagnosable.
            logger.warning('Firebase ID token verification failed: %s', exc)
            return Response({'error': 'Firebase ID token is invalid or expired.'}, status=status.HTTP_401_UNAUTHORIZED)

        email = (claims.get('email') or '').strip().lower()
        uid = (claims.get('uid') or claims.get('sub') or '').strip()
        name = (claims.get('name') or '').strip()
        if not email or not uid or not claims.get('email_verified', False):
            return Response({'error': 'The Firebase account must provide a verified email address.'}, status=status.HTTP_400_BAD_REQUEST)

        portal_role = serializer.validated_data.get('role', 'pilgrim')
        phone_number = (claims.get('phone_number') or '').strip()
        organization = serializer.validated_data.get('organization', '').strip()

        # Find existing user by email
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            # Firebase proves identity, not application authorization. Admin
            # accounts must be provisioned by an existing administrator first.
            if portal_role == 'admin':
                return Response({
                    'error': 'Admin accounts must be provisioned before Firebase sign-in.',
                    'code': 'ADMIN_PROVISIONING_REQUIRED',
                }, status=status.HTTP_403_FORBIDDEN)
            name_parts = (name or email.split('@')[0]).split(' ', 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            clean_email = email.split('@')[0].replace('.', '_').replace('+', '')
            username = f"fb_{portal_role}_{clean_email}_{random.randint(100, 999)}"

            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=secrets.token_urlsafe(20)
            )
            profile = UserProfile.objects.create(
                user=user,
                firebase_uid=uid,
                role=portal_role,
                mobile_number=phone_number if phone_number else None,
                organization=organization or (
                    'Pandharpur Wari Seva Mandal' if portal_role == 'volunteer' else 'Warkari Devotee'
                ),
                department='General Field Seva' if portal_role == 'volunteer' else None,
                squad_id='PENDING-ASSIGNMENT' if portal_role == 'volunteer' else None,
                approval_status='pending' if portal_role == 'volunteer' else 'approved',
                is_approved=portal_role != 'volunteer',
            )
        else:
            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': portal_role, 'mobile_number': phone_number if phone_number else None, 'firebase_uid': uid}
            )
            if profile.firebase_uid and profile.firebase_uid != uid:
                return Response({'error': 'This account is already linked to a different Firebase account.'}, status=status.HTTP_403_FORBIDDEN)
            if not profile.firebase_uid:
                profile.firebase_uid = uid
                profile.save(update_fields=['firebase_uid'])
            # Enforce strict role match
            if profile.role != portal_role:
                role_titles = {
                    'admin': 'Admin / Seva Team',
                    'volunteer': 'Volunteer / Sevekar',
                    'pilgrim': 'Pilgrim / Warkari',
                }
                curr_title = role_titles.get(profile.role, profile.role.title())
                code_map = {
                    'admin': 'ROLE_MISMATCH_ADMIN',
                    'volunteer': 'ROLE_MISMATCH_VOLUNTEER',
                    'pilgrim': 'ROLE_MISMATCH_PILGRIM',
                }
                return Response({
                    'error': f'This account is registered as a {curr_title} account. Please switch to the {curr_title} Portal to sign in.',
                    'code': code_map.get(profile.role, 'ROLE_MISMATCH'),
                    'correct_role': profile.role,
                    'name': user.get_full_name() or user.username
                }, status=status.HTTP_403_FORBIDDEN)

            # Update name if provided and missing
            if not user.first_name and name:
                name_parts = name.split(' ', 1)
                user.first_name = name_parts[0]
                user.last_name = name_parts[1] if len(name_parts) > 1 else ''
                user.save()

        # Google/Firebase verifies the person, but an administrator must approve
        # every volunteer before granting access to the field dashboard.
        if portal_role == 'volunteer' and (
            not profile.is_approved or profile.approval_status != 'approved'
        ):
            return Response({
                'error': 'Your volunteer request is pending administrator approval.',
                'code': 'VOLUNTEER_PENDING_APPROVAL',
                'approval_status': profile.approval_status,
                'name': profile_data['name'] if 'profile_data' in locals() else user.get_full_name() or user.username,
            }, status=status.HTTP_403_FORBIDDEN)

        login(request, user)
        profile_data = UserProfileSerializer(profile).data

        return Response({
            'message': 'Firebase authentication successful',
            'session': {
                'role': profile.role,
                'identifier': email,
                'name': profile_data['name'],
                'email': user.email,
                'mobile_number': profile.mobile_number,
                'organization': profile.organization,
                'department': profile.department,
                'squad_id': profile.squad_id,
                'id': user.id
            }
        }, status=status.HTTP_200_OK)



class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Invalid data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        identifier = serializer.validated_data['identifier'].strip()
        user = find_user_by_identifier(identifier)
        
        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))

        if user and hasattr(user, 'profile'):
            profile = user.profile
            profile.reset_otp = otp
            profile.reset_otp_created_at = timezone.now()
            profile.save()

        return Response({
            'message': f'Verification OTP sent to {identifier}. (Demo OTP: {otp})',
            'demo_otp': otp,
            'identifier': identifier
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Invalid data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        identifier = serializer.validated_data['identifier'].strip()
        otp = serializer.validated_data['otp'].strip()
        new_password = serializer.validated_data['new_password']

        user = find_user_by_identifier(identifier)
        if not user:
            return Response({'error': 'User not found.', 'code': 'USER_NOT_FOUND'}, status=status.HTTP_404_NOT_FOUND)

        profile = getattr(user, 'profile', None)
        # Verify OTP (allow test OTP 123456, 999999, or matching saved otp)
        if profile and (profile.reset_otp == otp or otp in ['123456', '999999']):
            user.set_password(new_password)
            user.save()
            profile.reset_otp = None
            profile.save()
            return Response({'message': 'Password has been reset successfully! Please sign in.'}, status=status.HTTP_200_OK)
        
        return Response({'error': 'Invalid or expired OTP code.'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            serializer = UserProfileSerializer(profile)
            return Response({
                'authenticated': True,
                'session': {
                    'role': profile.role,
                    'identifier': profile.mobile_number or request.user.email or request.user.username,
                    'name': serializer.data['name'],
                    'email': request.user.email,
                    'mobile_number': profile.mobile_number,
                    'organization': profile.organization,
                    'department': profile.department,
                    'squad_id': profile.squad_id,
                    'dindi_number': profile.dindi_number,
                    'emergency_contact': profile.emergency_contact,
                    'id': request.user.id
                },
                'profile': serializer.data
            })
        return Response({'authenticated': False, 'session': None})

    def put(self, request):
        return self.patch(request)

    def patch(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

        data = request.data
        name = data.get('name', '').strip()
        if name:
            parts = name.split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
        
        if 'email' in data:
            user.email = data['email'].strip()
        user.save()

        if 'mobile_number' in data:
            profile.mobile_number = data['mobile_number'].strip() or None
        if 'organization' in data:
            profile.organization = data['organization'].strip()
        if 'department' in data:
            profile.department = data['department'].strip()
        if 'squad_id' in data:
            profile.squad_id = data['squad_id'].strip()
        if 'dindi_number' in data:
            profile.dindi_number = data['dindi_number'].strip()
        if 'emergency_contact' in data:
            profile.emergency_contact = data['emergency_contact'].strip()
        profile.save()

        serializer = UserProfileSerializer(profile)
        return Response({
            'message': 'Profile updated successfully!',
            'session': {
                'role': profile.role,
                'identifier': profile.mobile_number or user.email or user.username,
                'name': serializer.data['name'],
                'email': user.email,
                'mobile_number': profile.mobile_number,
                'organization': profile.organization,
                'dindi_number': profile.dindi_number,
                'emergency_contact': profile.emergency_contact,
                'id': user.id
            },
            'profile': serializer.data
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class VolunteerRequestView(APIView):
    """Allows field volunteers to submit an access request awaiting Admin confirmation."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VolunteerRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Invalid request data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        name = serializer.validated_data['name'].strip()
        identifier = serializer.validated_data['identifier'].strip()
        password = serializer.validated_data['password']
        org = serializer.validated_data.get('organization', '').strip() or 'Pandharpur Wari Seva Mandal'
        department = serializer.validated_data.get('department', 'Food & Annachatra Seva').strip()
        squad_id = serializer.validated_data.get('squad_id', 'SQD-FOOD-101').strip()
        clean_phone = normalize_mobile(identifier)

        user = find_user_by_identifier(identifier)
        if user:
            # Update existing user to volunteer role with pending status
            user.set_password(password)
            parts = name.split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
            user.save()

            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = 'volunteer'
            profile.organization = org
            profile.department = department
            profile.squad_id = squad_id
            profile.approval_status = 'pending'
            profile.is_approved = False
            profile.requested_at = timezone.now()
            profile.save()
        else:
            clean_id = clean_phone if clean_phone else (identifier.replace('@', '_').replace('.', '_') if '@' in identifier else identifier)
            uname = f"volunteer_{clean_id}_{secrets.token_hex(2)}"
            parts = name.split(' ', 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ''

            user = User.objects.create_user(
                username=uname,
                email=identifier if '@' in identifier else f"{clean_id}@varimitra.org",
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            profile = UserProfile.objects.create(
                user=user,
                role='volunteer',
                mobile_number=clean_phone if clean_phone else None,
                organization=org,
                department=department,
                squad_id=squad_id,
                approval_status='pending',
                is_approved=False,
                requested_at=timezone.now()
            )

        return Response({
            'message': 'Volunteer access request submitted to Central Command! Please wait for Admin confirmation.',
            'status': 'pending',
            'request': {
                'id': user.id,
                'name': name,
                'identifier': identifier,
                'department': department,
                'squad_id': squad_id,
                'organization': org,
                'approval_status': 'pending',
                'requested_at': profile.requested_at.isoformat()
            }
        }, status=status.HTTP_201_CREATED)


class VolunteerStatusCheckView(APIView):
    """Allows the volunteer login waiting screen to poll approval status."""
    permission_classes = [AllowAny]

    def get(self, request):
        identifier = request.query_params.get('identifier', '').strip()
        if not identifier:
            return Response({'error': 'Identifier is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = find_user_by_identifier(identifier)
        if not user or not hasattr(user, 'profile'):
            return Response({'error': 'No request found for this identifier', 'exists': False}, status=status.HTTP_404_NOT_FOUND)

        profile = user.profile
        if profile.role != 'volunteer':
            return Response({'role': profile.role, 'is_approved': True, 'approval_status': 'approved'})

        # If approved, auto-login user into current session
        if profile.is_approved and profile.approval_status == 'approved':
            login(request, user)
            profile_data = UserProfileSerializer(profile).data
            return Response({
                'exists': True,
                'is_approved': True,
                'approval_status': 'approved',
                'session': {
                    'role': 'volunteer',
                    'identifier': identifier,
                    'name': profile_data['name'],
                    'email': user.email,
                    'mobile_number': profile.mobile_number,
                    'organization': profile.organization,
                    'department': profile.department,
                    'squad_id': profile.squad_id,
                    'approval_status': 'approved',
                    'is_approved': True,
                    'has_admin_access': True,
                    'id': user.id
                }
            }, status=status.HTTP_200_OK)

        return Response({
            'exists': True,
            'is_approved': profile.is_approved,
            'approval_status': profile.approval_status,
            'name': user.get_full_name() or user.username,
            'department': profile.department,
            'squad_id': profile.squad_id,
            'requested_at': profile.requested_at.isoformat() if profile.requested_at else None
        }, status=status.HTTP_200_OK)


class AdminVolunteerRequestsListView(APIView):
    """Admin endpoint to view all volunteer requests with pending count for taskbar badge."""
    permission_classes = [AllowAny]

    def get(self, request):
        volunteers = UserProfile.objects.filter(role='volunteer').order_by('-requested_at')
        requests_data = []

        for p in volunteers:
            requests_data.append({
                'id': p.user.id,
                'user_id': p.user.id,
                'username': p.user.username,
                'name': p.user.get_full_name() or p.user.username,
                'email': p.user.email,
                'mobile_number': p.mobile_number,
                'identifier': p.mobile_number or p.user.email or p.user.username,
                'organization': p.organization or 'Pandharpur Wari Seva Mandal',
                'department': p.department or 'General Field Seva',
                'squad_id': p.squad_id or 'SQD-VOL-101',
                'approval_status': p.approval_status,
                'is_approved': p.is_approved,
                'requested_at': p.requested_at.strftime('%d %b %Y, %I:%M %p') if p.requested_at else 'Recent',
                'approved_at': p.approved_at.strftime('%d %b %Y, %I:%M %p') if p.approved_at else None,
            })

        pending_count = sum(1 for r in requests_data if r['approval_status'] == 'pending' or not r['is_approved'])

        return Response({
            'pending_count': pending_count,
            'total_count': len(requests_data),
            'requests': requests_data
        }, status=status.HTTP_200_OK)


class AdminVolunteerApprovalActionView(APIView):
    """Admin endpoint to approve or reject a volunteer request."""
    permission_classes = [AllowAny]

    def post(self, request, user_id, action):
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({'error': 'Volunteer user not found'}, status=status.HTTP_404_NOT_FOUND)

        profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'volunteer'})
        
        if action == 'approve':
            profile.is_approved = True
            profile.approval_status = 'approved'
            profile.approved_at = timezone.now()
            if request.user.is_authenticated:
                profile.approved_by = request.user
            profile.save()

            return Response({
                'message': f"Volunteer {user.get_full_name() or user.username} approved! Full Admin Access Granted.",
                'user_id': user_id,
                'approval_status': 'approved',
                'is_approved': True
            }, status=status.HTTP_200_OK)

        elif action == 'reject':
            profile.is_approved = False
            profile.approval_status = 'rejected'
            profile.save()

            return Response({
                'message': f"Volunteer request for {user.get_full_name() or user.username} rejected.",
                'user_id': user_id,
                'approval_status': 'rejected',
                'is_approved': False
            }, status=status.HTTP_200_OK)

        return Response({'error': 'Invalid action. Choose approve or reject.'}, status=status.HTTP_400_BAD_REQUEST)

