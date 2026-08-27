from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import UserProfile
from wari_core.models import PalkhiLocation, EmergencyAlert, SevaResource, CrowdDensity

class Command(BaseCommand):
    help = 'Seed initial demo users, Palkhi locations, and Seva resources'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting VariMitra database seeding...'))

        # 1. Create Default Pilgrim User
        pilgrim_user, created = User.objects.get_or_create(
            username='pilgrim_demo',
            defaults={
                'first_name': 'Dnyandev',
                'last_name': 'Tukaram',
                'email': 'warkari@varimitra.org'
            }
        )
        if created:
            pilgrim_user.set_password('wari2026')
            pilgrim_user.save()
            UserProfile.objects.create(
                user=pilgrim_user,
                role='pilgrim',
                mobile_number='9876543210',
                organization='Alandi Dindi No. 1'
            )
            self.stdout.write(self.style.SUCCESS('Created demo pilgrim user (9876543210 / wari2026)'))

        # 2. Create Default Admin User
        admin_user, created = User.objects.get_or_create(
            username='admin_demo',
            defaults={
                'first_name': 'Seva Admin',
                'last_name': 'Officer',
                'email': 'seva.admin@varimitra.org',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            UserProfile.objects.create(
                user=admin_user,
                role='admin',
                mobile_number='9822001122',
                organization='Pandharpur Wari Seva Mandal Control Room'
            )
            self.stdout.write(self.style.SUCCESS('Created demo admin user (seva.admin@varimitra.org / admin123)'))

        # 3. Create Palkhi Tracking Locations
        PalkhiLocation.objects.all().delete()
        PalkhiLocation.objects.create(
            palkhi_name='Shri Sant Dnyaneshwar Maharaj Palkhi',
            palkhi_name_mr='श्री संत ज्ञानेश्वर महाराज पालखी सोहळा',
            current_stop='Saswad Checkpoint (सासवड)',
            current_stop_mr='सासवड चेकपॉईंट',
            next_stop='Jejuri Pavan Khind (जेजुरी)',
            next_stop_mr='जेजुरी पावनखिंड',
            latitude=18.3444,
            longitude=74.0305,
            status='LIVE',
            distance_covered_km=68.5,
            total_distance_km=245.0,
            eta_next_stop='2 hrs 15 mins',
            schedule_status='12.4 km ahead of schedule',
            is_active=True
        )
        PalkhiLocation.objects.create(
            palkhi_name='Shri Sant Tukaram Maharaj Palkhi',
            palkhi_name_mr='श्री संत तुकाराम महाराज पालखी सोहळा',
            current_stop='Loni Kalbhor (लोणी काळभोर)',
            current_stop_mr='लोणी काळभोर',
            next_stop='Yawat (यवत)',
            next_stop_mr='यवत',
            latitude=18.4900,
            longitude=74.0200,
            status='LIVE',
            distance_covered_km=54.2,
            total_distance_km=240.0,
            eta_next_stop='3 hrs 40 mins',
            schedule_status='On Time',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS('Seeded Palkhi live telemetry'))

        # 4. Create Seva Resources
        SevaResource.objects.all().delete()
        resources = [
            {
                'name': 'Mobile Ambulance Unit 4',
                'name_mr': 'फिरती रुग्णवाहिका पथक ४',
                'category': 'MEDICAL',
                'location_name': 'Saswad Bypass (400m ahead on Left)',
                'distance_meters': 400,
                'contact_number': '108',
                'capacity_or_supplies': 'Emergency Doctor, Oxygen & First Aid Available'
            },
            {
                'name': 'Clean Drinking Water Stall 12',
                'name_mr': 'स्वच्छ पिण्याच्या पाण्याची सोय क्र. १२',
                'category': 'WATER',
                'location_name': 'Bapdev Ghat Descent, Tent 3',
                'distance_meters': 250,
                'contact_number': '+91 9422001122',
                'capacity_or_supplies': '5,000 Litres RO Cold Water'
            },
            {
                'name': 'Warkari Annachatra Mahaprasad',
                'name_mr': 'वारकरी अन्नछत्र महाप्रसाद',
                'category': 'FOOD',
                'location_name': 'Jejuri Entrance Toll Plaza',
                'distance_meters': 1200,
                'contact_number': '+91 9823114455',
                'capacity_or_supplies': '24/7 Garam Khichdi, Tea & Poha'
            },
            {
                'name': 'Night Shelter Camp #8',
                'name_mr': 'रात्र मुक्काम तंबू केंद्र क्र. ८',
                'category': 'SHELTER',
                'location_name': 'Saswad Zilla Parishad School Ground',
                'distance_meters': 800,
                'contact_number': '+91 9922334455',
                'capacity_or_supplies': 'Capacity for 1,200 Devotees with Mats & Tarpaulins'
            },
            {
                'name': 'Sanitation Block #15',
                'name_mr': 'स्वच्छतागृह व मोबाईल टॉयलेट्स क्र. १५',
                'category': 'SANITATION',
                'location_name': 'Near Saswad ST Bus Stand',
                'distance_meters': 600,
                'contact_number': '+91 9876543210',
                'capacity_or_supplies': '20 Mobile Toilets for Men & Women'
            }
        ]
        for r in resources:
            SevaResource.objects.create(**r)
        self.stdout.write(self.style.SUCCESS('Seeded Seva resources'))

        # 5. Create Crowd Density
        CrowdDensity.objects.all().delete()
        CrowdDensity.objects.create(
            location_name='Ringan Ground (Saswad Sector)',
            density_level='NORMAL',
            flow_speed='Normal flow (3.8 km/h)',
            recommended_action='Normal pilgrim flow. Keep left side clear for seva ambulances.',
            active_volunteers_count=32
        )
        CrowdDensity.objects.create(
            location_name='Diva Ghat Ascent (दिवा घाट)',
            density_level='MODERATE',
            flow_speed='Slow steady march (2.2 km/h)',
            recommended_action='Dindi lines following single-file discipline. Water stalls active.',
            active_volunteers_count=48
        )
        self.stdout.write(self.style.SUCCESS('Seeded crowd flow metrics'))

        self.stdout.write(self.style.SUCCESS('Database seeding complete successfully!'))
