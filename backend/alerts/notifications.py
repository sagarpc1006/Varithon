def notify_alert(alert):
    """Mock FCM push notification — same pattern as sos/notifications.py."""
    print('--- MOCK FCM ALERT ---')
    if alert.type == 'announcement':
        print(f'Push to ALL users: [{alert.type}] {alert.title}')
    else:
        print(
            f'Push to users within {alert.radius_km}km '
            f'of ({alert.zone_lat}, {alert.zone_lng}): [{alert.type}] {alert.title}'
        )
    print('----------------------')
