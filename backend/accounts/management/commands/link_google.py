"""
Management command to link a real Google/Firebase email to any role account,
so Google Sign-In works for all three portals (admin, volunteer, pilgrim).

Usage:
  python manage.py link_google --email your@gmail.com --role admin
  python manage.py link_google --email your@gmail.com --role volunteer
  python manage.py link_google --email your@gmail.com --role pilgrim
  python manage.py link_google --email your@gmail.com --role admin --name "Your Name"

If the user already exists (same email), it updates their role and marks them approved.
If they don't exist, it creates a fresh account ready for Google Sign-In.
"""

import secrets
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from accounts.models import UserProfile

ROLE_META = {
    'admin': {
        'org': 'Pandharpur Wari Seva Mandal',
        'is_staff': True,
        'is_approved': True,
        'approval_status': 'approved',
        'department': 'Seva Control Center',
        'squad_id': None,
    },
    'volunteer': {
        'org': 'Pandharpur Wari Seva Mandal',
        'is_staff': False,
        'is_approved': True,
        'approval_status': 'approved',
        'department': 'General Field Seva',
        'squad_id': 'SQD-FIELD-001',
    },
    'pilgrim': {
        'org': 'Alandi Dindi No. 1',
        'is_staff': False,
        'is_approved': True,
        'approval_status': 'approved',
        'department': None,
        'squad_id': None,
    },
}


class Command(BaseCommand):
    help = 'Link a Google/Firebase email to an app role so Google Sign-In works for that portal.'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help='Your Google account email address')
        parser.add_argument(
            '--role', required=True, choices=['admin', 'volunteer', 'pilgrim'],
            help='The portal role to assign: admin | volunteer | pilgrim'
        )
        parser.add_argument('--name', default='', help='Full name (optional, e.g. "Sagar Patil")')

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        role = options['role']
        name = options['name'].strip()

        if not email or '@' not in email:
            raise CommandError('Provide a valid email address with --email.')

        meta = ROLE_META[role]
        name_parts = (name or email.split('@')[0].replace('.', ' ').title()).split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        # ── Find or create Django User ─────────────────────────────────────
        user = User.objects.filter(email__iexact=email).first()
        if user:
            self.stdout.write(f"  Found existing user: {user.username} ({user.email})")
            if not user.first_name and first_name:
                user.first_name = first_name
                user.last_name = last_name
        else:
            clean = email.split('@')[0].replace('.', '_').replace('+', '')
            username = f"{role}_{clean}"
            # Ensure username uniqueness
            if User.objects.filter(username=username).exists():
                username = f"{username}_{secrets.token_hex(3)}"
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=secrets.token_urlsafe(20),  # random — login is via Firebase only
            )
            self.stdout.write(f"  Created new user: {user.username} ({user.email})")

        user.is_staff = meta['is_staff']
        user.save()

        # ── Find or create UserProfile ─────────────────────────────────────
        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.is_approved = meta['is_approved']
        profile.approval_status = meta['approval_status']
        profile.organization = profile.organization or meta['org']
        if meta['department']:
            profile.department = profile.department or meta['department']
        if meta['squad_id']:
            profile.squad_id = profile.squad_id or meta['squad_id']
        profile.save()

        action = 'Created' if created else 'Updated'
        role_display = {'admin': 'Admin / Seva Team', 'volunteer': 'Volunteer / Sevekar', 'pilgrim': 'Pilgrim / Warkari'}[role]

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 55))
        self.stdout.write(self.style.SUCCESS(f'  ✓ {action} {role_display} account'))
        self.stdout.write(self.style.SUCCESS(f'  Email : {email}'))
        self.stdout.write(self.style.SUCCESS(f'  Role  : {role}'))
        self.stdout.write(self.style.SUCCESS(f'  Status: approved & ready'))
        self.stdout.write(self.style.SUCCESS('=' * 55))
        self.stdout.write('')
        self.stdout.write('  Now open the app and click "Sign in with Google"')
        self.stdout.write(f'  on the {"Admin" if role == "admin" else role.capitalize()} portal.')
        self.stdout.write('')
