import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from crowdflow.models import Zone, CrowdDensityReading, ZoneCapacityStatus, CrowdAlert, VolunteerDeployment
from crowdflow.risk_score import calculate_risk_score

class Command(BaseCommand):
    help = 'Seeds initial Wari zones, live crowd density readings, risk scores, history, and alerts.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding crowdflow data...'))

        # Standard Wari zones matching Palkhi route
        ZONES_DATA = [
            {
                'name': 'Alandi',
                'name_mr': 'आळंदी',
                'lat': 18.6775,
                'lng': 73.8967,
                'capacity': 55000,
                'count': 18400,
                'direction': 'Towards Pune',
                'speed': 4.2,
                'trend': 'decreasing'
            },
            {
                'name': 'Pune City',
                'name_mr': 'पुणे शहर',
                'lat': 18.5204,
                'lng': 73.8567,
                'capacity': 65000,
                'count': 38200,
                'direction': 'Towards Hadapsar',
                'speed': 3.6,
                'trend': 'stable'
            },
            {
                'name': 'Hadapsar Diveghat',
                'name_mr': 'हडपसर दिवेघाट',
                'lat': 18.5020,
                'lng': 73.9270,
                'capacity': 50000,
                'count': 32100,
                'direction': 'Towards Saswad',
                'speed': 3.2,
                'trend': 'increasing'
            },
            {
                'name': 'Saswad',
                'name_mr': 'सासवड',
                'lat': 18.3444,
                'lng': 74.0305,
                'capacity': 48000,
                'count': 42000,
                'direction': 'Towards Jejuri',
                'speed': 2.8,
                'trend': 'increasing'
            },
            {
                'name': 'Jejuri',
                'name_mr': 'जेजुरी',
                'lat': 18.2747,
                'lng': 74.1565,
                'capacity': 48000,
                'count': 45210,
                'direction': 'Towards Walhe',
                'speed': 2.4,
                'trend': 'increasing'
            },
            {
                'name': 'Walhe',
                'name_mr': 'वाल्हे',
                'lat': 18.1764,
                'lng': 74.1612,
                'capacity': 45000,
                'count': 36500,
                'direction': 'Towards Lonand',
                'speed': 3.0,
                'trend': 'increasing'
            },
            {
                'name': 'Lonand',
                'name_mr': 'लोणंद',
                'lat': 18.0463,
                'lng': 74.1895,
                'capacity': 45000,
                'count': 28400,
                'direction': 'Towards Taradgaon',
                'speed': 3.8,
                'trend': 'stable'
            },
            {
                'name': 'Taradgaon',
                'name_mr': 'तरडगाव',
                'lat': 17.9942,
                'lng': 74.3211,
                'capacity': 40000,
                'count': 14200,
                'direction': 'Towards Phaltan',
                'speed': 4.1,
                'trend': 'stable'
            },
            {
                'name': 'Phaltan',
                'name_mr': 'फलटण',
                'lat': 17.9856,
                'lng': 74.4332,
                'capacity': 50000,
                'count': 26800,
                'direction': 'Towards Barad',
                'speed': 3.7,
                'trend': 'stable'
            },
            {
                'name': 'Barad',
                'name_mr': 'बरड',
                'lat': 17.8921,
                'lng': 74.6210,
                'capacity': 40000,
                'count': 15100,
                'direction': 'Towards Natepute',
                'speed': 4.0,
                'trend': 'stable'
            },
            {
                'name': 'Natepute',
                'name_mr': 'नातेपुते',
                'lat': 17.9042,
                'lng': 74.7745,
                'capacity': 45000,
                'count': 24300,
                'direction': 'Towards Malshiras',
                'speed': 3.6,
                'trend': 'stable'
            },
            {
                'name': 'Malshiras',
                'name_mr': 'माळशिरस',
                'lat': 17.8423,
                'lng': 74.9082,
                'capacity': 45000,
                'count': 29500,
                'direction': 'Towards Velapur',
                'speed': 3.5,
                'trend': 'increasing'
            },
            {
                'name': 'Velapur',
                'name_mr': 'वेळापूर',
                'lat': 17.7654,
                'lng': 75.0543,
                'capacity': 45000,
                'count': 39100,
                'direction': 'Towards Wakhari',
                'speed': 2.9,
                'trend': 'increasing'
            },
            {
                'name': 'Wakhari',
                'name_mr': 'वाखरी',
                'lat': 17.6987,
                'lng': 75.2541,
                'capacity': 50000,
                'count': 44000,
                'direction': 'Towards Pandharpur',
                'speed': 2.6,
                'trend': 'increasing'
            },
            {
                'name': 'Pandharpur',
                'name_mr': 'पंढरपूर',
                'lat': 17.6775,
                'lng': 75.3278,
                'capacity': 60000,
                'count': 49800,
                'direction': 'Temple Sanctum / Chandrabhaga',
                'speed': 2.1,
                'trend': 'increasing'
            },
        ]

        now = timezone.now()

        for zd in ZONES_DATA:
            zone, _ = Zone.objects.update_or_create(
                name=zd['name'],
                defaults={
                    'name_mr': zd['name_mr'],
                    'latitude': zd['lat'],
                    'longitude': zd['lng'],
                    'max_safe_capacity': zd['capacity']
                }
            )

            # Special override for Jejuri to match screenshot
            if zd['name'] == 'Jejuri':
                risk_score = 92
                status_level = 'critical'
            elif zd['name'] == 'Saswad':
                risk_score = 78
                status_level = 'high'
            elif zd['name'] == 'Walhe':
                risk_score = 68
                status_level = 'high'
            else:
                risk_score, status_level = calculate_risk_score(
                    person_count=zd['count'],
                    max_capacity=zd['capacity'],
                    growth_trend=zd['trend'],
                    movement_speed_kmh=zd['speed']
                )

            # Update / Create ZoneCapacityStatus
            ZoneCapacityStatus.objects.update_or_create(
                zone=zone,
                defaults={
                    'current_status': status_level,
                    'risk_score': risk_score,
                    'movement_direction': zd['direction'],
                    'movement_speed_kmh': zd['speed'],
                    'trend': zd['trend'],
                    'last_breach_at': now if risk_score >= 80 else None
                }
            )

            # Clear old readings and generate 6-hour history
            zone.density_readings.all().delete()

            # Create 12 readings (every 30 mins over past 6 hrs)
            current_count = max(5000, zd['count'] - random.randint(12000, 18000))
            for i in range(12, -1, -1):
                timestamp = now - timedelta(minutes=i * 30)
                if i == 0:
                    person_count = zd['count']
                else:
                    drift = random.randint(800, 2000)
                    current_count = min(zd['count'], current_count + drift)
                    person_count = current_count

                reading_risk, reading_level = calculate_risk_score(
                    person_count=person_count,
                    max_capacity=zd['capacity'],
                    growth_trend=zd['trend'],
                    movement_speed_kmh=zd['speed']
                )

                CrowdDensityReading.objects.create(
                    zone=zone,
                    person_count=person_count,
                    density_level=reading_level,
                    source='simulated',
                    recorded_at=timestamp
                )

        # Clear and seed active Crowd Alerts matching screenshot
        CrowdAlert.objects.all().delete()
        jejuri_zone = Zone.objects.filter(name='Jejuri').first()
        saswad_zone = Zone.objects.filter(name='Saswad').first()
        wakhari_zone = Zone.objects.filter(name='Wakhari').first()

        if jejuri_zone:
            CrowdAlert.objects.create(
                zone=jejuri_zone,
                title='Critical Congestion at Jejuri Temple Steps',
                description='Crowd density exceeded safe limits. Movement halted for 15 mins.',
                risk_score=92,
                risk_level='critical',
                action_type='Deploy'
            )

        if saswad_zone:
            CrowdAlert.objects.create(
                zone=saswad_zone,
                title='Water Station Depleted near Saswad',
                description='Station 4 reporting less than 10% capacity. High ambient temperature.',
                risk_score=75,
                risk_level='high',
                action_type='Dispatch'
            )

        if wakhari_zone:
            CrowdAlert.objects.create(
                zone=wakhari_zone,
                title='Bottleneck Queue at Wakhari Junction',
                description='Merging of 3 major Dindi groups causing slow dispersal.',
                risk_score=72,
                risk_level='high',
                action_type='Deploy'
            )

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(ZONES_DATA)} Wari zones with live telemetry and alerts.'))
