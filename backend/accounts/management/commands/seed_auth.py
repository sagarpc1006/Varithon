from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import UserProfile

class Command(BaseCommand):
    help = 'Seeds initial test & demo accounts with strict roles and passwords'

    def handle(self, *args, **options):
        self.stdout.write("Seeding authentication accounts...")

        # 1. Pilgrim Demo Account (Phone: 9876543210 / password)
        pilgrim_user = User.objects.filter(username='pilgrim_demo').first() or User.objects.filter(email='warkari@varimitra.org').first()
        if not pilgrim_user:
            pilgrim_user = User.objects.create_user(
                username='pilgrim_demo',
                email='warkari@varimitra.org',
                first_name='Dnyandev',
                last_name='Maharaj'
            )
        pilgrim_user.set_password('password')
        pilgrim_user.save()

        profile, _ = UserProfile.objects.get_or_create(user=pilgrim_user)
        profile.role = 'pilgrim'
        profile.mobile_number = '9876543210'
        profile.organization = 'Alandi Dindi No. 1'
        profile.save()
        self.stdout.write(self.style.SUCCESS("[OK] Pilgrim Demo seeded: Phone 9876543210 / password"))

        # 2. Admin Demo Account (Email: seva.admin@varimitra.org / admin123)
        admin_demo = User.objects.filter(username='admin_demo').first() or User.objects.filter(email='seva.admin@varimitra.org').first()
        if not admin_demo:
            admin_demo = User.objects.create_user(
                username='admin_demo',
                email='seva.admin@varimitra.org',
                first_name='Seva Officer',
                last_name='Pandharpur'
            )
        admin_demo.set_password('admin123')
        admin_demo.is_staff = True
        admin_demo.save()

        profile_admin, _ = UserProfile.objects.get_or_create(user=admin_demo)
        profile_admin.role = 'admin'
        profile_admin.organization = 'Pandharpur Wari Seva Mandal'
        profile_admin.save()
        self.stdout.write(self.style.SUCCESS("[OK] Admin Demo seeded: Email seva.admin@varimitra.org / admin123"))

        # 3. Main Admin Account (Email: admin@varimitra.org / admin123)
        main_admin = User.objects.filter(email='admin@varimitra.org').first()
        if not main_admin:
            main_admin = User.objects.create_user(
                username='admin_main',
                email='admin@varimitra.org',
                first_name='Yashraj',
                last_name='Admin'
            )
        main_admin.set_password('admin123')
        main_admin.is_staff = True
        main_admin.is_superuser = True
        main_admin.save()

        profile_main, _ = UserProfile.objects.get_or_create(user=main_admin)
        profile_main.role = 'admin'
        profile_main.organization = 'Wari Control Center'
        profile_main.save()
        self.stdout.write(self.style.SUCCESS("[OK] Main Admin seeded: Email admin@varimitra.org / admin123"))

        self.stdout.write(self.style.SUCCESS("[SUCCESS] All authentication seed data is ready!"))
