from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    name = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'name',
            'role',
            'mobile_number',
            'organization',
            'department',
            'squad_id',
            'dindi_number',
            'emergency_contact',
            'is_verified',
            'approval_status',
            'is_approved',
            'requested_at',
            'approved_at',
            'created_at'
        ]

    def get_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name if full_name else obj.user.username


class VolunteerRequestSerializer(serializers.Serializer):
    name = serializers.CharField(required=True, max_length=150)
    identifier = serializers.CharField(required=True, max_length=150)
    password = serializers.CharField(required=True, min_length=4, write_only=True)
    organization = serializers.CharField(required=False, allow_blank=True, default='')
    department = serializers.CharField(required=False, allow_blank=True, default='Food & Annachatra Seva')
    squad_id = serializers.CharField(required=False, allow_blank=True, default='SQD-FOOD-101')



class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    role = serializers.ChoiceField(choices=['pilgrim', 'volunteer', 'admin'], default='pilgrim')


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(required=True, max_length=150)
    identifier = serializers.CharField(required=True, max_length=150) # mobile number or email
    password = serializers.CharField(required=True, min_length=4, write_only=True)
    role = serializers.ChoiceField(choices=['pilgrim', 'volunteer', 'admin'], default='pilgrim')
    organization = serializers.CharField(required=False, allow_blank=True, default='')
    department = serializers.CharField(required=False, allow_blank=True, default='')
    squad_id = serializers.CharField(required=False, allow_blank=True, default='')


class GoogleAuthSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=['pilgrim', 'volunteer', 'admin'], default='pilgrim')
    email = serializers.EmailField(required=False, default='google.user@varimitra.org')
    name = serializers.CharField(required=False, default='Google Devotee')


class ForgotPasswordSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    role = serializers.ChoiceField(choices=['pilgrim', 'volunteer', 'admin'], default='pilgrim')


class ResetPasswordSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    otp = serializers.CharField(required=True, max_length=6)
    new_password = serializers.CharField(required=True, min_length=4)


class CheckIdentifierSerializer(serializers.Serializer):
    identifier = serializers.CharField(required=True)
    role = serializers.ChoiceField(choices=['pilgrim', 'volunteer', 'admin'], default='pilgrim')


class FirebaseLoginSerializer(serializers.Serializer):
    # Identity fields are derived from the verified Firebase token.
    role = serializers.ChoiceField(choices=['pilgrim', 'volunteer', 'admin'], default='pilgrim')
    organization = serializers.CharField(required=False, allow_blank=True, default='')
    department = serializers.CharField(required=False, allow_blank=True, default='')
    squad_id = serializers.CharField(required=False, allow_blank=True, default='')
    id_token = serializers.CharField(required=True, allow_blank=False, trim_whitespace=True)


