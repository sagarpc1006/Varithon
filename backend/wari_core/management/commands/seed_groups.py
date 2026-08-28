import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from accounts.models import UserProfile
from wari_core.models import Group, GroupMember, GroupMessage, MessageReport

class Command(BaseCommand):
    help = 'Seed initial realistic Wari Groups matching the VariMitra visual reference'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Wari Groups and Members...')

        # Ensure demo admin and pilgrim users exist
        admin_user, _ = User.objects.get_or_create(
            username='admin_yashraj',
            defaults={
                'first_name': 'Yashraj',
                'last_name': 'Gadlikar',
                'email': 'admin@varimitra.org',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()
        UserProfile.objects.get_or_create(
            user=admin_user,
            defaults={
                'role': 'admin',
                'mobile_number': '9876500001',
                'organization': 'Seva Team Administrator'
            }
        )

        pilgrim_user, _ = User.objects.get_or_create(
            username='pilgrim_yashraj',
            defaults={
                'first_name': 'Yashraj',
                'last_name': 'Warkari',
                'email': 'yashraj@varimitra.org',
            }
        )
        pilgrim_user.set_password('password')
        pilgrim_user.save()
        UserProfile.objects.get_or_create(
            user=pilgrim_user,
            defaults={
                'role': 'pilgrim',
                'mobile_number': '9876543210',
                'organization': 'Alandi Dindi No. 1'
            }
        )

        # Create demo devotees
        devotees_data = [
            ('rahul_k', 'Rahul', 'Kulkarni', 'pilgrim', '9876500002'),
            ('priya_p', 'Priya', 'Patil', 'pilgrim', '9876500003'),
            ('ramesh_s', 'Ramesh', 'Shinde', 'pilgrim', '9876500004'),
            ('sunil_j', 'Sunil', 'Jadhav', 'pilgrim', '9876500005'),
            ('doctor_m', 'Dr. Anand', 'Deshmukh', 'admin', '9876500006'),
        ]

        devotee_users = []
        for uname, fname, lname, role, mob in devotees_data:
            u, _ = User.objects.get_or_create(
                username=uname,
                defaults={'first_name': fname, 'last_name': lname, 'email': f'{uname}@varimitra.org'}
            )
            u.set_password('password')
            u.save()
            UserProfile.objects.get_or_create(user=u, defaults={'role': role, 'mobile_number': mob})
            devotee_users.append(u)

        # 5 Exact Groups from visual reference
        groups_seed = [
            {
                'name': 'Saswad Warkari Group',
                'description': 'Official community communication and coordination for pilgrims in Saswad sector.',
                'group_type': 'PUBLIC',
                'route_info': 'Saswad Checkpoint -> Jejuri',
                'icon_color': 'orange',
                'members_target': 128,
                'messages': [
                    {
                        'user': devotee_users[0],
                        'name': 'Rahul',
                        'role': 'pilgrim',
                        'type': 'TEXT',
                        'content': 'Water station is 200m ahead.',
                        'minutes_ago': 25,
                    },
                    {
                        'user': devotee_users[1],
                        'name': 'Priya',
                        'role': 'pilgrim',
                        'type': 'TEXT',
                        'content': 'Medical camp near the checkpoint.',
                        'minutes_ago': 23,
                    },
                    {
                        'user': devotee_users[2],
                        'name': 'Ramesh',
                        'role': 'pilgrim',
                        'type': 'TEXT',
                        'content': 'Anyone need help? I am near the temple.',
                        'minutes_ago': 20,
                    },
                    {
                        'user': admin_user,
                        'name': 'Admin',
                        'role': 'admin',
                        'type': 'ANNOUNCEMENT',
                        'content': '⚠️ Route temporarily crowded. Please stay on the left side.',
                        'minutes_ago': 15,
                        'pinned': True,
                    },
                    {
                        'user': devotee_users[3],
                        'name': 'Sunil',
                        'role': 'pilgrim',
                        'type': 'TEXT',
                        'content': 'Thanks for the update!',
                        'minutes_ago': 10,
                    },
                ]
            },
            {
                'name': 'Jejuri Route Group',
                'description': 'Real-time updates, ghat climbing tips and halting points for Jejuri Pavan Khind.',
                'group_type': 'PUBLIC',
                'route_info': 'Jejuri Pavan Khind Route Updates',
                'icon_color': 'purple',
                'members_target': 86,
                'messages': [
                    {
                        'user': devotee_users[1],
                        'name': 'Priya',
                        'role': 'pilgrim',
                        'type': 'TEXT',
                        'content': 'Priya: Medical camp near Jejuri toll is open with full ORS stock.',
                        'minutes_ago': 50,
                    },
                    {
                        'user': devotee_users[0],
                        'name': 'Rahul',
                        'role': 'pilgrim',
                        'type': 'TEXT',
                        'content': 'Palkhi is entering Jejuri within 45 mins. Jai Hari Vitthal!',
                        'minutes_ago': 30,
                    },
                ]
            },
            {
                'name': 'Volunteer Help Group',
                'description': 'Coordination for seva volunteers, crowd assistance, and elderly pilgrim support.',
                'group_type': 'PUBLIC',
                'route_info': 'Seva, Help & Support',
                'icon_color': 'green',
                'members_target': 42,
                'messages': [
                    {
                        'user': devotee_users[2],
                        'name': 'Ramesh',
                        'role': 'pilgrim',
                        'type': 'TEXT',
                        'content': 'Ramesh: Need 2 volunteers at Annachatra Gate 3.',
                        'minutes_ago': 120,
                    },
                    {
                        'user': admin_user,
                        'name': 'Admin',
                        'role': 'admin',
                        'type': 'ANNOUNCEMENT',
                        'content': '📢 Evening Prasad distribution shift starts at 6:00 PM.',
                        'minutes_ago': 90,
                        'pinned': True,
                    },
                ]
            },
            {
                'name': 'Medical Assistance Group',
                'description': '24/7 doctors, ambulances, first aid stalls and emergency helpline updates.',
                'group_type': 'PUBLIC',
                'route_info': 'Medical Camps & Assistance',
                'icon_color': 'rose',
                'members_target': 56,
                'messages': [
                    {
                        'user': devotee_users[4],
                        'name': 'Dr. Anand',
                        'role': 'admin',
                        'type': 'TEXT',
                        'content': 'Doctor: Camp at checkpoint has orthopedic bandages and pain sprays.',
                        'minutes_ago': 180,
                    },
                ]
            },
            {
                'name': 'Family & Friends Group',
                'description': 'Private group for family coordination and sharing live whereabouts.',
                'group_type': 'PRIVATE',
                'route_info': 'Private group for family & friends',
                'icon_color': 'blue',
                'members_target': 6,
                'messages': [
                    {
                        'user': pilgrim_user,
                        'name': 'Yashraj',
                        'role': 'pilgrim',
                        'type': 'TEXT',
                        'content': 'Where are you now? We are near the banyan tree.',
                        'minutes_ago': 300,
                    },
                ]
            },
        ]

        now = timezone.now()
        for g_data in groups_seed:
            group, created = Group.objects.get_or_create(
                name=g_data['name'],
                defaults={
                    'description': g_data['description'],
                    'group_type': g_data['group_type'],
                    'route_info': g_data['route_info'],
                    'icon_color': g_data['icon_color'],
                    'created_by': admin_user,
                    'is_active': True,
                }
            )

            # Ensure both logged-in test users and sample devotees are members
            GroupMember.objects.get_or_create(group=group, user=admin_user, defaults={'role': 'ADMIN'})
            GroupMember.objects.get_or_create(group=group, user=pilgrim_user, defaults={'role': 'MEMBER'})
            for du in devotee_users:
                GroupMember.objects.get_or_create(group=group, user=du, defaults={'role': 'MEMBER'})

            # Add dummy dummy members to match realistic member count
            current_count = group.members.count()
            needed = g_data['members_target'] - current_count
            for i in range(max(0, min(needed, 10))):
                dummy_u, _ = User.objects.get_or_create(
                    username=f"devotee_{group.id}_{i}",
                    defaults={
                        'first_name': f'Warkari_{i+1}',
                        'last_name': 'Mandal',
                        'email': f'devotee_{group.id}_{i}@wari.org'
                    }
                )
                GroupMember.objects.get_or_create(group=group, user=dummy_u, defaults={'role': 'MEMBER'})

            # Add seed messages if not present
            if not group.messages.exists():
                for m_data in g_data['messages']:
                    msg = GroupMessage.objects.create(
                        group=group,
                        sender=m_data['user'],
                        sender_name=m_data['name'],
                        sender_role=m_data['role'],
                        message_type=m_data['type'],
                        content=m_data['content'],
                        is_pinned=m_data.get('pinned', False),
                        created_at=now - timedelta(minutes=m_data['minutes_ago'])
                    )

        # Seed sample report for Admin moderation test
        first_group = Group.objects.first()
        if first_group:
            msg_to_report = first_group.messages.filter(message_type='TEXT').first()
            if msg_to_report and not msg_to_report.reports.exists():
                MessageReport.objects.create(
                    message=msg_to_report,
                    reported_by=pilgrim_user,
                    reason='Misleading checkpoint distance information',
                    status='PENDING'
                )

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {Group.objects.count()} groups and related communications!'))
