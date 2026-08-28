def notify_sos(report):
    print(f"--- MOCK FCM NOTIFICATION ---")
    if report.type == 'medical':
        print(f"Pushing to nearby admins + volunteers for Medical SOS: ID {report.id} at ({report.lat}, {report.lng})")
    elif report.type in ['issue', 'general_issue', 'lost_item']:
        print(f"Pushing to nearby admins only for SOS: {report.type}, ID {report.id} at ({report.lat}, {report.lng})")
    elif report.type == 'restroom':
        print(f"No notification required for Restroom SOS: ID {report.id}")
    else:
        print(f"Unknown SOS type: {report.type}")
    print("-----------------------------")

def notify_user_reply(report):
    print(f"--- MOCK FCM NOTIFICATION ---")
    print(f"Pushing reply to single user {report.reporter.username} for SOS ID {report.id}")
    print(f"Message: {report.admin_reply}")
    print("-----------------------------")
