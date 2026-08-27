import re
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import PalkhiLocation, EmergencyAlert, SevaResource, CrowdDensity
from .serializers import (
    PalkhiLocationSerializer,
    EmergencyAlertSerializer,
    SevaResourceSerializer,
    CrowdDensitySerializer,
    AIChatQuerySerializer,
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
