import time
import random
from django.core.management.base import BaseCommand
from crowdflow.models import Zone, CrowdDensityReading, ZoneCapacityStatus
from crowdflow.risk_score import calculate_risk_score

class Command(BaseCommand):
    help = 'Runs real-time crowd data simulator in terminal for live demonstrations.'

    def add_arguments(self, parser):
        parser.add_argument('--interval', type=int, default=5, help='Seconds between updates (default: 5)')

    def handle(self, *args, **options):
        interval = options['interval']
        self.stdout.write(self.style.SUCCESS(f'Starting CrowdFlow Simulator (interval: {interval}s)... Press Ctrl+C to stop.'))

        while True:
            try:
                zones = Zone.objects.all()
                for zone in zones:
                    latest = zone.density_readings.first()
                    current_count = latest.person_count if latest else 25000
                    drift = random.randint(-600, 900)
                    new_count = max(2000, min(zone.max_safe_capacity + 6000, current_count + drift))
                    trend = 'increasing' if drift > 150 else 'decreasing' if drift < -150 else 'stable'
                    speed = round(max(0.8, min(4.5, 4.0 - (new_count / zone.max_safe_capacity) * 2.5 + random.uniform(-0.2, 0.2))), 1)

                    risk_score, status_level = calculate_risk_score(
                        person_count=new_count,
                        max_capacity=zone.max_safe_capacity,
                        growth_trend=trend,
                        movement_speed_kmh=speed
                    )

                    CrowdDensityReading.objects.create(
                        zone=zone,
                        person_count=new_count,
                        density_level=status_level,
                        source='simulated'
                    )

                    status_obj, _ = ZoneCapacityStatus.objects.get_or_create(zone=zone)
                    status_obj.current_status = status_level
                    status_obj.risk_score = risk_score
                    status_obj.movement_speed_kmh = speed
                    status_obj.trend = trend
                    status_obj.save()

                self.stdout.write(f'[{time.strftime("%X")}] Updated {zones.count()} zones.')
                time.sleep(interval)
            except KeyboardInterrupt:
                self.stdout.write(self.style.WARNING('Simulator stopped.'))
                break
