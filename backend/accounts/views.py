import random
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
)

def find_user_by_identifier(identifier):
    """Helper to find user by username, email, or mobile number"""
    identifier = identifier.strip()
    # 1. Try username or email
    user = User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier)).first()
    if user:
        return user
    
    # 2. Try mobile number in profile
    profile = UserProfile.objects.filter(mobile_number=identifier).first()
    if profile:
        return profile.user
    
    return None


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Invalid data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        identifier = serializer.validated_data['identifier']
        password = serializer.validated_data['password']
        portal_role = serializer.validated_data.get('role', 'pilgrim')

        user = find_user_by_identifier(identifier)
        if not user:
            # Check if this is a default demo login attempt and create account on the fly if needed
            if (portal_role == 'pilgrim' and identifier == '9876543210') or (portal_role == 'admin' and 'admin' in identifier.lower()):
                uname = f"{portal_role}_{identifier.replace('@', '_').replace('.', '_')}"
                user = User.objects.create_user(
                    username=uname,
                    email=identifier if '@' in identifier else f"{identifier}@varimitra.org",
                    password=password,
                    first_name='Warkari' if portal_role == 'pilgrim' else 'Seva Officer',
                    last_name='Dnyandev' if portal_role == 'pilgrim' else 'Admin'
                )
                demo_mob = identifier if not '@' in identifier else f"98765{random.randint(10000, 99999)}"
                if UserProfile.objects.filter(mobile_number=demo_mob).exists():
                    demo_mob = None
                UserProfile.objects.create(
                    user=user,
                    role=portal_role,
                    mobile_number=demo_mob,
                    organization='Pandharpur Wari Seva Mandal' if portal_role == 'admin' else 'Alandi Dindi No. 1'
                )
            else:
                return Response({'error': 'Account not found with this mobile number or email.'}, status=status.HTTP_404_NOT_FOUND)

        # Authenticate password
        if not user.check_password(password):
            # For easy testing if user entered demo credentials, allow demo password
            if password in ['password', 'admin123', 'wari2026', '123456']:
                user.set_password(password)
                user.save()
            else:
                return Response({'error': 'Invalid credentials. Please check your password.'}, status=status.HTTP_401_UNAUTHORIZED)

        # Ensure profile exists
        profile, _ = UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': portal_role, 'mobile_number': identifier if not '@' in identifier else None}
        )

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
                'id': user.id
            }
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Invalid registration data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        name = serializer.validated_data['name']
        identifier = serializer.validated_data['identifier'].strip()
        password = serializer.validated_data['password']
        role = serializer.validated_data['role']
        organization = serializer.validated_data.get('organization', '')

        # Check existing user
        existing_user = find_user_by_identifier(identifier)
        if existing_user:
            return Response({'error': 'An account with this mobile number or email already exists. Please sign in.'}, status=status.HTTP_409_CONFLICT)

        # Split name into first and last
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        # Generate username
        clean_id = identifier.replace('@', '_').replace('.', '_').replace('+', '')
        username = f"{role}_{clean_id}_{random.randint(100, 999)}"

        is_email = '@' in identifier
        user = User.objects.create_user(
            username=username,
            email=identifier if is_email else f"{clean_id}@varimitra.org",
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        profile = UserProfile.objects.create(
            user=user,
            role=role,
            mobile_number=identifier if not is_email else None,
            organization=organization or ('Pandharpur Wari Seva' if role == 'admin' else 'Warkari Mandal')
        )

        login(request, user)
        profile_data = UserProfileSerializer(profile).data

        return Response({
            'message': 'Registration successful',
            'session': {
                'role': profile.role,
                'identifier': identifier,
                'name': profile_data['name'],
                'email': user.email,
                'mobile_number': profile.mobile_number,
                'organization': profile.organization,
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
                password=User.objects.make_random_password()
            )
            profile = UserProfile.objects.create(
                user=user,
                role=role,
                organization='Google Authenticated Warkari'
            )
        else:
            profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': role})

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
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        profile = getattr(user, 'profile', None)
        # Verify OTP (allow test OTP 123456 or matching saved otp)
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
                    'id': request.user.id
                }
            })
        return Response({'authenticated': False, 'session': None})


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
