import re
import os
import json
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import PalkhiLocation, EmergencyAlert, SevaResource, CrowdDensity, NearbyResource
from .serializers import (
    PalkhiLocationSerializer,
    EmergencyAlertSerializer,
    SevaResourceSerializer,
    CrowdDensitySerializer,
    AIChatQuerySerializer,
    NearbyResourceSerializer,
)


class PalkhiLocationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        palkhis = PalkhiLocation.objects.filter(is_active=True)
        if not palkhis.exists():
            # Create default live sample
            PalkhiLocation.objects.create(
                palkhi_name='Sant Dnyaneshwar Maharaj Palkhi',
                palkhi_name_mr='श्री संत ज्ञानेश्वर महाराज पालखी',
                current_stop='Saswad Checkpoint',
                current_stop_mr='सासवड चेकपॉईंट',
                next_stop='Jejuri Pavan Khind',
                next_stop_mr='जेजुरी पावनखिंड',
                status='LIVE',
                distance_covered_km=68.5,
                total_distance_km=245.0,
                eta_next_stop='2 hrs 15 mins',
                schedule_status='12.4 km ahead of schedule'
            )
            palkhis = PalkhiLocation.objects.filter(is_active=True)
        
        serializer = PalkhiLocationSerializer(palkhis, many=True)
        # Also return the primary current active stop
        primary = serializer.data[0] if serializer.data else None
        return Response({
            'primary_palkhi': primary,
            'all_palkhis': serializer.data
        }, status=status.HTTP_200_OK)


class EmergencyAlertView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        alerts = EmergencyAlert.objects.all()[:20]
        serializer = EmergencyAlertSerializer(alerts, many=True)
        pending_count = EmergencyAlert.objects.filter(status='PENDING').count()
        dispatched_count = EmergencyAlert.objects.filter(status='DISPATCHED').count()
        return Response({
            'alerts': serializer.data,
            'pending_count': pending_count,
            'dispatched_count': dispatched_count,
            'total_alerts': len(serializer.data)
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = EmergencyAlertSerializer(data=request.data)
        if serializer.is_valid():
            alert = serializer.save(
                status='DISPATCHED',
                dispatched_unit='Mobile Medical Quick Response Team #7 (Saswad Sector)'
            )
            return Response({
                'message': '🚨 Emergency SOS received! Rescue & Medical response unit dispatched immediately.',
                'alert': EmergencyAlertSerializer(alert).data,
                'emergency_contact': '108 (Ambulance) / 112 (Police Helpline)'
            }, status=status.HTTP_201_CREATED)
        return Response({'error': 'Invalid SOS request', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class SevaResourceListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        category = request.query_params.get('category', None)
        queryset = SevaResource.objects.filter(is_active=True)
        if category:
            queryset = queryset.filter(category__iexact=category)
        
        if not queryset.exists():
            # Seed default seva resources
            sample_resources = [
                {
                    'name': 'Mobile Ambulance Unit 4',
                    'name_mr': 'फिरती रुग्णवाहिका पथक ४',
                    'category': 'MEDICAL',
                    'location_name': 'Saswad Bypass (400m ahead on Left)',
                    'distance_meters': 400,
                    'contact_number': '108',
                    'capacity_or_supplies': 'Emergency Doctor & Oxygen Available'
                },
                {
                    'name': 'Clean Drinking Water Stall 12',
                    'name_mr': 'स्वच्छ पिण्याच्या पाण्याची सोय क्र. १२',
                    'category': 'WATER',
                    'location_name': 'Bapdev Ghat Descent, Tent 3',
                    'distance_meters': 250,
                    'contact_number': '+91 9422001122',
                    'capacity_or_supplies': '5000L RO Cold Water Stored'
                },
                {
                    'name': 'Warkari Annachatra Mahaprasad',
                    'name_mr': 'वारकरी अन्नछत्र महाप्रसाद',
                    'category': 'FOOD',
                    'location_name': 'Jejuri Entrance Toll Plaza',
                    'distance_meters': 1200,
                    'contact_number': '+91 9823114455',
                    'capacity_or_supplies': 'Continuous Garam Khichdi & Tea'
                },
                {
                    'name': 'Night Shelter Camp #8',
                    'name_mr': 'रात्र मुक्काम तंबू केंद्र क्र. ८',
                    'category': 'SHELTER',
                    'location_name': 'Saswad Zilla Parishad School Ground',
                    'distance_meters': 800,
                    'contact_number': '+91 9922334455',
                    'capacity_or_supplies': 'Capacity for 1200 Warkaris'
                }
            ]
            for res in sample_resources:
                SevaResource.objects.create(**res)
            queryset = SevaResource.objects.filter(is_active=True)

        serializer = SevaResourceSerializer(queryset, many=True)
        return Response({'resources': serializer.data}, status=status.HTTP_200_OK)


class CrowdDensityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        density = CrowdDensity.objects.all()
        if not density.exists():
            CrowdDensity.objects.create(
                location_name='Ringan Ground (Saswad Sector)',
                density_level='NORMAL',
                flow_speed='Normal flow (3.8 km/h)',
                recommended_action='Normal pilgrim flow. Keep left side clear for seva vehicles.',
                active_volunteers_count=32
            )
            density = CrowdDensity.objects.all()

        serializer = CrowdDensitySerializer(density, many=True)
        return Response({'crowd_status': serializer.data}, status=status.HTTP_200_OK)


class AIChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AIChatQuerySerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'error': 'Invalid query', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        msg = serializer.validated_data['message'].strip().lower()
        lang = serializer.validated_data.get('language', 'en')
        user_name = serializer.validated_data.get('user_name', 'Bhakt')

        reply_text = ""
        category = "general"

        # Multilingual intelligent matching
        if any(w in msg for w in ['location', 'where', 'palkhi', 'stop', 'कुठे', 'पालखी', 'कहा', 'कहाँ']):
            category = "location"
            if lang == 'mr':
                reply_text = "🚩 **पालखी थेट अपडेट:**\nश्री संत ज्ञानेश्वर महाराज पालखी सध्या **सासवड चेकपॉईंट** येथे आहे. पुढील मुक्काम **जेजुरी पावनखिंड** येथे अंदाजे २ तास १५ मिनिटांत पोहोचेल. वाटचाल सुरळीत सुरू आहे!"
            elif lang == 'hi':
                reply_text = "🚩 **पालखी लाइव अपडेट:**\nश्री संत ज्ञानेश्वर महाराज पालखी वर्तमान में **सासवड चेकपॉइंट** पर है। अगला पड़ाव **जेजुरी पावनखिंड** लगभग २ घंटे १५ मिनट में पहुंचेगा।"
            else:
                reply_text = "🚩 **Live Palkhi Update:**\nShri Sant Dnyaneshwar Maharaj Palkhi is currently passing the **Saswad Checkpoint**. Next halt is **Jejuri Pavan Khind** in approx. 2 hrs 15 mins. March is 12.4 km ahead of schedule!"

        elif any(w in msg for w in ['doctor', 'medical', 'hospital', 'ambulance', 'औषध', 'रुग्णवाहिका', 'दवाखाना', 'डॉक्टर', 'तब्येत', 'तबीयत', 'बीमार']):
            category = "medical"
            if lang == 'mr':
                reply_text = "🏥 **वैद्यकीय मदत व रुग्णवाहिका सेवा:**\n- जवळची फिरती रुग्णवाहिका: **सासवड बायपासवर डाव्या बाजूला ४०० मीटरवर** सज्ज आहे.\n- आपत्कालीन मदत क्रमांक: **108** (मोफत रुग्णवाहिका) किंवा **112**.\n- सर्व औषधे व प्रथमोपचार वारकऱ्यांसाठी मोफत उपलब्ध आहेत."
            elif lang == 'hi':
                reply_text = "🏥 **चिकित्सा सहायता एवं एम्बुलेंस:**\n- निकटतम मोबाइल एम्बुलेंस: **सासवड बाईपास पर बाएं हाथ पर ४०० मीटर** दूर है।\n- आपातकालीन नंबर: **108** (एम्बुलेंस) / **112** (पुलिस)। प्राथमिक उपचार पूरी तरह निःशुल्क है।"
            else:
                reply_text = "🏥 **Medical Seva & Ambulance:**\n- Nearest Mobile Ambulance: **Saswad Bypass (400m ahead on left)**.\n- Emergency Dial: **108** (Ambulance) / **112** (Emergency).\n- Doctors, ORS, and pain-relief sprays are completely free for all pilgrims."

        elif any(w in msg for w in ['water', 'drink', 'food', 'jevan', 'annachatra', 'पाणी', 'जेवण', 'अन्नछत्र', 'पानी', 'खाना', 'प्रसाद']):
            category = "resources"
            if lang == 'mr':
                reply_text = "💧 **अन्न व पाणी सोय:**\n- स्वच्छ पिण्याचे पाणी: **बापदेव घाट उतरणीवर २५० मीटरवर** आरओ पाण्याचा स्टॉल क्र. १२ सुरू आहे.\n- महाप्रसाद अन्नछत्र: **जेजुरी प्रवेशद्वार** येथे गरम खिचडी व चहा २४ तास उपलब्ध आहे."
            elif lang == 'hi':
                reply_text = "💧 **भोजन और शुद्ध जल सेवा:**\n- शुद्ध पेयजल: **बापदेव घाट के पास २५० मीटर** पर आरओ जल केंद्र उपलब्ध है।\n- महाप्रसाद अन्नछत्र: **जेजुरी टोल प्लाजा** पर २४ घंटे भोजन एवं चाय उपलब्ध है।"
            else:
                reply_text = "💧 **Food & Water Seva:**\n- Clean RO Drinking Water: **Stall #12 (250m ahead on Bapdev Ghat)**.\n- Annachatra Mahaprasad: **Jejuri Entrance** (Hot Khichdi & tea running 24/7)."

        elif any(w in msg for w in ['sos', 'emergency', 'help', 'police', 'मदत', 'पोलीस', 'आपत्कालीन', 'संकट', 'मदद']):
            category = "sos"
            if lang == 'mr':
                reply_text = "🚨 **आपत्कालीन मदत केंद्र:**\n- तुम्ही वरील लाल **'Emergency SOS'** बटण दाबून तात्काळ मदत मागू शकता.\n- वारी सुरक्षा नियंत्रण कक्ष: **०२०-२६१२३३४४**\n- पोलीस मदत: **११२** | रुग्णवाहिका: **१०८**"
            elif lang == 'hi':
                reply_text = "🚨 **आपातकालीन सहायता:**\n- आप सीधे लाल **'Emergency SOS'** बटन दबाकर तुरंत मदद बुला सकते हैं।\n- पुलिस नियंत्रण कक्ष: **112** | एम्बुलेंस: **108**"
            else:
                reply_text = "🚨 **Emergency Assistance:**\n- Tap the red **'Emergency SOS'** button anytime on your screen to alert field rescue teams.\n- Wari Helpline: **020-26123344** | Police: **112** | Ambulance: **108**."

        elif any(w in msg for w in ['darshan', 'temple', 'pandharpur', 'दर्शन', 'पंढरपूर', 'मंदिर', 'विठ्ठल']):
            category = "darshan"
            if lang == 'mr':
                reply_text = "🙏 **पंढरपूर श्री विठ्ठल-रुक्मिणी दर्शन:**\n- मुखदर्शन रांग: सुमारे २ ते ३ तास.\n- पदस्पर्श दर्शन: ऑनलाइन ई-पास किंवा प्रत्यक्ष रांगेतून उपलब्ध.\n- विठू माउलींच्या कृपेने सर्वांचा प्रवास सुखकर होवो! ॥ जय हरी विठ्ठल ॥"
            elif lang == 'hi':
                reply_text = "🙏 **पंढरपुर श्री विट्ठल दर्शन सूचना:**\n- मुख दर्शन कतार: लगभग २ से ३ घंटे।\n- पदस्पर्श दर्शन ई-पास एवं सामान्य कतार दोनों से उपलब्ध है।\n॥ जय हरि विट्ठल ॥"
            else:
                reply_text = "🙏 **Pandharpur Darshan Guidelines:**\n- Mukh Darshan queue: Approx. 2-3 hours.\n- Padsparsh Darshan: Available through e-pass and standard queues.\n- May Lord Vitthal bless your journey! ॥ Jai Hari Vitthal ॥"

        else:
            if lang == 'mr':
                reply_text = f"जय हरी विठ्ठल {user_name}! 🙏 मी तुमचा वारीमित्र एआय सहाय्यक आहे. तुम्ही मला पालखीचे स्थान, जवळची रुग्णवाहिका, पाण्याचे स्टॉल, किंवा आपत्कालीन मदतीबद्दल कधीही विचारू शकता."
            elif lang == 'hi':
                reply_text = f"जय हरि विट्ठल {user_name}! 🙏 मैं आपका वारीमित्र एआई सहायक हूँ। आप मुझसे पालखी की स्थिति, नजदीकी चिकित्सा सेवा, पेयजल स्टॉल या आपातकालीन मदद के बारे में पूछ सकते हैं।"
            else:
                reply_text = f"Jai Hari Vitthal {user_name}! 🙏 I am your VariMitra AI companion. Ask me anything about live Palkhi locations, nearby water/medical camps, crowd density, or emergency help."

        return Response({
            'reply': reply_text,
            'category': category,
            'timestamp': 'Just now'
        }, status=status.HTTP_200_OK)


class DashboardOverviewView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        palkhi = PalkhiLocation.objects.filter(is_active=True).first()
        alerts_count = EmergencyAlert.objects.filter(status='PENDING').count()
        medical_res = SevaResource.objects.filter(category='MEDICAL', is_active=True).first()
        water_res = SevaResource.objects.filter(category='WATER', is_active=True).first()
        crowd = CrowdDensity.objects.first()

        return Response({
            'palkhi': PalkhiLocationSerializer(palkhi).data if palkhi else None,
            'pending_alerts_count': alerts_count,
            'nearest_medical': SevaResourceSerializer(medical_res).data if medical_res else None,
            'nearest_water': SevaResourceSerializer(water_res).data if water_res else None,
            'crowd_status': CrowdDensitySerializer(crowd).data if crowd else None,
            'system_status': 'OPERATIONAL',
        }, status=status.HTTP_200_OK)


class WariLocationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        file_path = os.path.join(settings.BASE_DIR, 'wari_core', 'data', 'wari-2025-locations.json')
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NearbyResourceListCreateView(APIView):
    """Admin adds resources at Palkhi stops; both admin and user fetch all active resources."""
    permission_classes = [AllowAny]

    def get(self, request):
        resources = NearbyResource.objects.filter(is_active=True)
        serializer = NearbyResourceSerializer(resources, many=True)
        return Response({'resources': serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = NearbyResourceSerializer(data=request.data)
        if serializer.is_valid():
            resource = serializer.save()
            return Response({
                'message': 'Resource added successfully!',
                'resource': NearbyResourceSerializer(resource).data
            }, status=status.HTTP_201_CREATED)
        return Response({'error': 'Invalid data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class NearbyResourceDeleteView(APIView):
    """Admin removes (soft-deletes) a resource by ID."""
    permission_classes = [AllowAny]

    def delete(self, request, pk):
        try:
            resource = NearbyResource.objects.get(pk=pk)
            resource.is_active = False
            resource.save()
            return Response({'message': 'Resource removed successfully.'}, status=status.HTTP_200_OK)
        except NearbyResource.DoesNotExist:
            return Response({'error': 'Resource not found.'}, status=status.HTTP_404_NOT_FOUND)


# ==========================================
# GROUPS / GROUP COMMUNICATION API VIEWS
# ==========================================
from django.db.models import Q, Count
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Group, GroupMember, GroupMessage, MessageReport
from .serializers import (
    GroupSerializer,
    GroupMemberSerializer,
    GroupMessageSerializer,
    MessageReportSerializer,
)

def broadcast_group_event(group_id, event_type, payload):
    """Helper to broadcast real-time events to connected WebSocket clients"""
    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f'group_chat_{group_id}',
                {
                    'type': event_type,
                    **payload
                }
            )
    except Exception as e:
        print(f"Broadcast warning: {e}")


class GroupListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        group_filter = request.query_params.get('filter', 'all')  # all, public, joined, private

        groups = Group.objects.filter(is_active=True)

        if q:
            groups = groups.filter(Q(name__icontains=q) | Q(description__icontains=q) | Q(route_info__icontains=q))

        if group_filter == 'public':
            groups = groups.filter(group_type='PUBLIC')
        elif group_filter == 'private':
            groups = groups.filter(group_type='PRIVATE')
        elif group_filter == 'joined':
            if request.user.is_authenticated:
                groups = groups.filter(members__user=request.user)

        serializer = GroupSerializer(groups, many=True, context={'request': request})
        return Response({
            'count': groups.count(),
            'groups': serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        name = request.data.get('name', '').strip()
        if not name:
            return Response({'error': 'Group name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        description = request.data.get('description', '')
        group_type = request.data.get('group_type', 'PUBLIC')
        route_info = request.data.get('route_info', 'Saswad Checkpoint -> Jejuri')
        icon_color = request.data.get('icon_color', 'orange')

        group = Group.objects.create(
            name=name,
            description=description,
            group_type=group_type,
            route_info=route_info,
            icon_color=icon_color,
            created_by=request.user if request.user.is_authenticated else None
        )

        # Creator becomes Group Admin
        if request.user.is_authenticated:
            GroupMember.objects.create(group=group, user=request.user, role='ADMIN')

        # Add default welcome system message
        msg = GroupMessage.objects.create(
            group=group,
            sender_name='VariMitra System',
            sender_role='admin',
            message_type='SYSTEM',
            content=f'Welcome to {group.name}! Wari route updates and assistance are live.'
        )

        serializer = GroupSerializer(group, context={'request': request})
        return Response({
            'message': 'Group created successfully!',
            'group': serializer.data
        }, status=status.HTTP_201_CREATED)


class GroupDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = GroupSerializer(group, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        group.name = request.data.get('name', group.name)
        group.description = request.data.get('description', group.description)
        group.route_info = request.data.get('route_info', group.route_info)
        group.group_type = request.data.get('group_type', group.group_type)
        group.icon_color = request.data.get('icon_color', group.icon_color)
        if 'is_active' in request.data:
            group.is_active = request.data['is_active']
        if 'allow_member_posts' in request.data:
            group.allow_member_posts = request.data['allow_member_posts']
        group.save()

        serializer = GroupSerializer(group, context={'request': request})
        return Response({
            'message': 'Group updated successfully.',
            'group': serializer.data
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            group = Group.objects.get(pk=pk)
            group.is_active = False
            group.save()
            return Response({'message': 'Group deactivated successfully.'}, status=status.HTTP_200_OK)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)


class GroupJoinLeaveView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        action = request.data.get('action', 'join')  # join or leave
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user if request.user.is_authenticated else None
        if not user:
            # For guest/demo session, use first or active user
            user = User.objects.first()

        if action == 'join':
            member, created = GroupMember.objects.get_or_create(
                group=group,
                user=user,
                defaults={'role': 'MEMBER'}
            )
            msg_content = f"{user.get_full_name() or user.username} joined the group."
            GroupMessage.objects.create(
                group=group,
                sender_name='VariMitra System',
                message_type='SYSTEM',
                content=msg_content
            )
            broadcast_group_event(group.id, 'chat_message_broadcast', {
                'message': {
                    'id': 0,
                    'group': group.id,
                    'sender_name': 'System',
                    'sender_role': 'system',
                    'message_type': 'SYSTEM',
                    'content': msg_content,
                    'created_at': timezone.now().isoformat()
                }
            })
            return Response({'message': 'Successfully joined group!', 'is_member': True}, status=status.HTTP_200_OK)

        elif action == 'leave':
            GroupMember.objects.filter(group=group, user=user).delete()
            return Response({'message': 'Left the group.', 'is_member': False}, status=status.HTTP_200_OK)

        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


class GroupMessageListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Mark messages read if user authenticated
        if request.user.is_authenticated:
            GroupMember.objects.filter(group=group, user=request.user).update(last_read_at=timezone.now())

        messages = group.messages.filter(is_deleted=False).order_by('created_at')
        serializer = GroupMessageSerializer(messages, many=True)
        return Response({
            'group_id': group.id,
            'group_name': group.name,
            'messages': serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request, pk):
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Message content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        sender_name = request.data.get('sender_name', '')
        sender_role = request.data.get('sender_role', 'pilgrim')
        message_type = request.data.get('message_type', 'TEXT')

        user = request.user if request.user.is_authenticated else None
        if not sender_name:
            if user:
                sender_name = user.get_full_name() or user.username
            else:
                sender_name = 'Warkari Devotee'

        msg = GroupMessage.objects.create(
            group=group,
            sender=user,
            sender_name=sender_name,
            sender_role=sender_role,
            message_type=message_type,
            content=content
        )

        msg_data = GroupMessageSerializer(msg).data
        # Broadcast via WebSocket
        broadcast_group_event(group.id, 'chat_message_broadcast', {'message': msg_data})

        return Response({
            'message': 'Message sent successfully.',
            'data': msg_data
        }, status=status.HTTP_201_CREATED)


class GroupAnnouncementView(APIView):
    """Admin official announcement broadcast"""
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Announcement content is required.'}, status=status.HTTP_400_BAD_REQUEST)

        sender_name = request.data.get('sender_name', 'Admin / Seva Team')
        user = request.user if request.user.is_authenticated else None

        msg = GroupMessage.objects.create(
            group=group,
            sender=user,
            sender_name=sender_name,
            sender_role='admin',
            message_type='ANNOUNCEMENT',
            content=content,
            is_pinned=True
        )

        msg_data = GroupMessageSerializer(msg).data
        broadcast_group_event(group.id, 'chat_message_broadcast', {'message': msg_data})

        return Response({
            'message': 'Official announcement dispatched & pinned!',
            'data': msg_data
        }, status=status.HTTP_201_CREATED)


class GroupMessageActionView(APIView):
    """Pin, Unpin, or Delete a message"""
    permission_classes = [AllowAny]

    def patch(self, request, pk, msg_id):
        try:
            msg = GroupMessage.objects.get(pk=msg_id, group_id=pk)
        except GroupMessage.DoesNotExist:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)

        if 'is_pinned' in request.data:
            msg.is_pinned = bool(request.data['is_pinned'])
            msg.save()
            broadcast_group_event(pk, 'message_pin_update', {'message_id': msg.id, 'is_pinned': msg.is_pinned})

        return Response({
            'message': f"Message {'pinned' if msg.is_pinned else 'unpinned'}.",
            'is_pinned': msg.is_pinned
        }, status=status.HTTP_200_OK)

    def delete(self, request, pk, msg_id):
        try:
            msg = GroupMessage.objects.get(pk=msg_id, group_id=pk)
            msg.is_deleted = True
            msg.save()
            broadcast_group_event(pk, 'message_deleted_broadcast', {'message_id': msg.id})
            return Response({'message': 'Message deleted successfully.'}, status=status.HTTP_200_OK)
        except GroupMessage.DoesNotExist:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)


class GroupMessageReportView(APIView):
    """Pilgrims or moderators reporting a message"""
    permission_classes = [AllowAny]

    def post(self, request, pk, msg_id):
        try:
            msg = GroupMessage.objects.get(pk=msg_id, group_id=pk)
        except GroupMessage.DoesNotExist:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', 'Inappropriate or misleading content').strip()
        user = request.user if request.user.is_authenticated else User.objects.first()

        report = MessageReport.objects.create(
            message=msg,
            reported_by=user,
            reason=reason
        )

        return Response({
            'message': 'Message reported to admin team for review.',
            'report': MessageReportSerializer(report).data
        }, status=status.HTTP_201_CREATED)


class GroupMemberListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        members = group.members.all()
        serializer = GroupMemberSerializer(members, many=True)
        return Response({
            'group_id': group.id,
            'count': members.count(),
            'members': serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request, pk):
        try:
            group = Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found.'}, status=status.HTTP_404_NOT_FOUND)

        user_id = request.data.get('user_id')
        role = request.data.get('role', 'MEMBER')
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        member, created = GroupMember.objects.get_or_create(group=group, user=user, defaults={'role': role})
        if not created:
            member.role = role
            member.save()

        return Response({
            'message': 'Member added successfully.',
            'member': GroupMemberSerializer(member).data
        }, status=status.HTTP_201_CREATED)


class GroupMemberManageView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, pk, user_id):
        try:
            member = GroupMember.objects.get(group_id=pk, user_id=user_id)
            if 'role' in request.data:
                member.role = request.data['role']
            if 'is_muted' in request.data:
                member.is_muted = request.data['is_muted']
            member.save()
            return Response({'message': 'Member role updated.', 'member': GroupMemberSerializer(member).data}, status=status.HTTP_200_OK)
        except GroupMember.DoesNotExist:
            return Response({'error': 'Group member not found.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk, user_id):
        try:
            GroupMember.objects.filter(group_id=pk, user_id=user_id).delete()
            return Response({'message': 'Member removed from group.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AdminGroupStatsView(APIView):
    """Admin statistics endpoint matching top 4 cards"""
    permission_classes = [AllowAny]

    def get(self, request):
        total_groups = Group.objects.count()
        total_memberships = GroupMember.objects.count()
        # Active members
        active_members = max(1, int(total_memberships * 0.6))
        # Total pending reports
        reports_count = MessageReport.objects.filter(status='PENDING').count()
        # Total messages
        total_messages = GroupMessage.objects.filter(is_deleted=False).count()
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_messages = GroupMessage.objects.filter(is_deleted=False, created_at__gte=today_start).count()

        return Response({
            'total_groups': total_groups,
            'total_members': total_memberships,
            'active_members': active_members,
            'pending_reports': reports_count,
            'total_messages': total_messages,
            'today_messages': today_messages,
        }, status=status.HTTP_200_OK)


class AdminReportsListView(APIView):
    """Admin moderation for reports"""
    permission_classes = [AllowAny]

    def get(self, request):
        group_id = request.query_params.get('group_id')
        reports = MessageReport.objects.all()
        if group_id:
            reports = reports.filter(message__group_id=group_id)

        serializer = MessageReportSerializer(reports, many=True)
        return Response({
            'total_reports': reports.count(),
            'reports': serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request, report_id):
        action = request.data.get('action', 'resolve')  # resolve, dismiss, delete_message
        try:
            report = MessageReport.objects.get(pk=report_id)
        except MessageReport.DoesNotExist:
            return Response({'error': 'Report not found.'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'resolve':
            report.status = 'RESOLVED'
            report.action_taken = request.data.get('action_taken', 'Reviewed and approved.')
            report.resolved_at = timezone.now()
            report.save()
        elif action == 'dismiss':
            report.status = 'DISMISSED'
            report.action_taken = 'Dismissed as false report.'
            report.resolved_at = timezone.now()
            report.save()
        elif action == 'delete_message':
            report.message.is_deleted = True
            report.message.save()
            report.status = 'RESOLVED'
            report.action_taken = 'Message removed from group.'
            report.resolved_at = timezone.now()
            report.save()
            broadcast_group_event(report.message.group.id, 'message_deleted_broadcast', {'message_id': report.message.id})

        return Response({
            'message': f'Report marked as {report.status}.',
            'report': MessageReportSerializer(report).data
        }, status=status.HTTP_200_OK)


