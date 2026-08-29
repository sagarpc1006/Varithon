import { Language } from './types';

export interface Translations {
  appName: string;
  tagline: string;
  chant: string;
  smartSafeSpiritual: string;
  heroSubtext: string;
  loggingInAs: string;
  
  // Portals
  pilgrimTitle: string;
  pilgrimDescription: string;
  loginAsPilgrim: string;
  
  adminTitle: string;
  adminDescription: string;
  loginAsAdmin: string;
  
  // Footer banner on home
  safeWari: string;
  smartWari: string;
  blessedWari: string;
  
  // Sign In Screen
  backToHome: string;
  signInHeading: string;
  choosePortal: string;
  
  pilgrimSignInTitle: string;
  pilgrimWelcome: string;
  mobileNumberLabel: string;
  mobileNumberPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  forgotPassword: string;
  signInPilgrimBtn: string;
  
  adminSignInTitle: string;
  adminWelcome: string;
  emailLabel: string;
  emailPlaceholder: string;
  signInAdminBtn: string;
  
  or: string;
  continueWithGoogle: string;
  
  newHere: string;
  createPilgrimAccount: string;
  needAdminAccount: string;
  requestAccess: string;
  
  // Role & Error notices
  switchToAdminPortal: string;
  switchToPilgrimPortal: string;
  accountNotFoundPilgrim: string;
  accountNotFoundAdmin: string;
  registerWithNumber: string;
  requestWithEmail: string;
  roleMismatchNotice: string;
  
  // Feature highlights
  aiAssistantTitle: string;
  aiAssistantDesc: string;
  liveLocationTitle: string;
  liveLocationDesc: string;
  emergencySosTitle: string;
  emergencySosDesc: string;
  smartAlertsTitle: string;
  smartAlertsDesc: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "VariMitra",
    tagline: "Every Step with Every Warkari",
    chant: "॥ विठ्ठल विठ्ठल जय हरी विठ्ठल ॥",
    smartSafeSpiritual: "Smart. Safe. Spiritual.",
    heroSubtext: "Your AI-powered companion for a safe and blessed Wari.",
    loggingInAs: "I am logging in as",
    
    pilgrimTitle: "Pilgrim / Warkari",
    pilgrimDescription: "Access assistance, navigation, facilities, AI helper and emergency support.",
    loginAsPilgrim: "Login as Pilgrim",
    
    adminTitle: "Admin / Seva Team",
    adminDescription: "Monitor pilgrims, manage emergencies, facilities, volunteers and alerts.",
    loginAsAdmin: "Login as Admin",
    
    safeWari: "Safe Wari",
    smartWari: "Smart Wari",
    blessedWari: "Blessed Wari",
    
    backToHome: "Back to Home",
    signInHeading: "Sign In",
    choosePortal: "Choose your portal to continue",
    
    pilgrimSignInTitle: "Pilgrim Sign In",
    pilgrimWelcome: "Welcome back, Warkari!",
    mobileNumberLabel: "Mobile Number",
    mobileNumberPlaceholder: "Mobile Number",
    passwordLabel: "Password",
    passwordPlaceholder: "Password",
    forgotPassword: "Forgot Password?",
    signInPilgrimBtn: "Sign In as Pilgrim",
    
    adminSignInTitle: "Admin Sign In",
    adminWelcome: "Welcome back, Seva Team!",
    emailLabel: "Email ID",
    emailPlaceholder: "Email ID",
    signInAdminBtn: "Sign In as Admin",
    
    or: "or",
    continueWithGoogle: "Continue with Google",
    
    newHere: "New here?",
    createPilgrimAccount: "Create Pilgrim Account",
    needAdminAccount: "Need an admin account?",
    requestAccess: "Request Access",
    
    switchToAdminPortal: "Switch to Admin Portal",
    switchToPilgrimPortal: "Switch to Pilgrim Portal",
    accountNotFoundPilgrim: "No account found with this mobile number. Please register to continue.",
    accountNotFoundAdmin: "No Admin account found with this email. Please request admin access.",
    registerWithNumber: "Create Account with this Number",
    requestWithEmail: "Request Admin Access with this Email",
    roleMismatchNotice: "Account belongs to a different portal",
    
    aiAssistantTitle: "AI Assistant",
    aiAssistantDesc: "24/7 help in Marathi, Hindi, English",
    liveLocationTitle: "Live Location",
    liveLocationDesc: "Navigation & real-time Wari updates",
    emergencySosTitle: "Emergency SOS",
    emergencySosDesc: "Quick help when you need it",
    smartAlertsTitle: "Smart Alerts",
    smartAlertsDesc: "Weather, crowd & safety alerts",
  },
  mr: {
    appName: "VariMitra",
    tagline: "वारकऱ्यांच्या सेवेत, प्रत्येक पावली सोबत",
    chant: "॥ विठ्ठल विठ्ठल जय हरी विठ्ठल ॥",
    smartSafeSpiritual: "स्मार्ट. सुरक्षित. आध्यात्मिक.",
    heroSubtext: "सुरक्षित आणि मंगल वारीसाठी आपला AI-सक्षम डिजिटल साथीदार.",
    loggingInAs: "मी लॉगिन करत आहे",
    
    pilgrimTitle: "वारकरी / भाविक",
    pilgrimDescription: "मार्गदर्शन, सुविधा माहिती, AI सहाय्यक आणि आपत्कालीन मदत मिळवा.",
    loginAsPilgrim: "वारकरी म्हणून लॉगिन करा",
    
    adminTitle: "प्रशासक / सेवा दल",
    adminDescription: "वारकरी सुरक्षा, सुविधा नियोजन, स्वयंसेवक आणि सूचनांचे व्यवस्थापन करा.",
    loginAsAdmin: "प्रशासक म्हणून लॉगिन करा",
    
    safeWari: "सुरक्षित वारी",
    smartWari: "स्मार्ट वारी",
    blessedWari: "आनंदमयी वारी",
    
    backToHome: "मुख्य पानावर जा",
    signInHeading: "साइन इन",
    choosePortal: "पुढे जाण्यासाठी आपले पोर्टल निवडा",
    
    pilgrimSignInTitle: "वारकरी साइन इन",
    pilgrimWelcome: "पुन्हा स्वागत आहे, वारकरी बंधू-भगिनींनो!",
    mobileNumberLabel: "मोबाईल नंबर",
    mobileNumberPlaceholder: "मोबाईल नंबर प्रविष्ट करा",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "पासवर्ड प्रविष्ट करा",
    forgotPassword: "पासवर्ड विसरलात?",
    signInPilgrimBtn: "वारकरी म्हणून साइन इन करा",
    
    adminSignInTitle: "प्रशासक साइन इन",
    adminWelcome: "पुन्हा स्वागत आहे, सेवा दल!",
    emailLabel: "ईमेल आयडी",
    emailPlaceholder: "ईमेल आयडी प्रविष्ट करा",
    signInAdminBtn: "प्रशासक म्हणून साइन इन करा",
    
    or: "किंवा",
    continueWithGoogle: "गुगलद्वारे पुढे जा",
    
    newHere: "नवीन आहात?",
    createPilgrimAccount: "वारकरी खाते तयार करा",
    needAdminAccount: "प्रशासक खाते हवे आहे?",
    requestAccess: "परवानगीसाठी विनंती करा",
    
    switchToAdminPortal: "प्रशासक पोर्टलवर जा",
    switchToPilgrimPortal: "वारकरी पोर्टलवर जा",
    accountNotFoundPilgrim: "या मोबाईल नंबरवर कोणतेही खाते नाही. कृपया नवीन खाते तयार करा.",
    accountNotFoundAdmin: "या ईमेलवर प्रशासक खाते नाही. कृपया परवानगी विनंती पाठवा.",
    registerWithNumber: "या नंबरवर नवीन खाते तयार करा",
    requestWithEmail: "या ईमेलने परवानगी विनंती करा",
    roleMismatchNotice: "हे खाते दुसऱ्या पोर्टलचे आहे",
    
    aiAssistantTitle: "AI सहाय्यक",
    aiAssistantDesc: "मराठी, हिंदी, इंग्रजीत २४/७ मदत",
    liveLocationTitle: "थेट स्थान (Live)",
    liveLocationDesc: "मार्गदर्शन आणि पालखीचे ताजे अपडेट्स",
    emergencySosTitle: "आपत्कालीन SOS",
    emergencySosDesc: "गरज भासल्यास तात्काळ वैद्यकीय व सुरक्षा मदत",
    smartAlertsTitle: "स्मार्ट सूचना",
    smartAlertsDesc: "हवामान, गर्दी आणि सुरक्षितता इशारे",
  },
  hi: {
    appName: "VariMitra",
    tagline: "हर कदम, हर वारकरी के संग",
    chant: "॥ विठ्ठल विठ्ठल जय हरी विठ्ठल ॥",
    smartSafeSpiritual: "स्मार्ट. सुरक्षित. आध्यात्मिक.",
    heroSubtext: "सुरक्षित और पावन वारी के लिए आपका AI-सक्षम डिजिटल साथी।",
    loggingInAs: "मैं लॉगिन कर रहा हूँ",
    
    pilgrimTitle: "तीर्थयात्री / वारकरी",
    pilgrimDescription: "सहायता, नेविगेशन, सुविधाएं, AI सहायक और आपातकालीन सहायता प्राप्त करें।",
    loginAsPilgrim: "वारकरी के रूप में लॉगिन करें",
    
    adminTitle: "एडमिन / सेवा दल",
    adminDescription: "यात्रियों की निगरानी, आपातकालीन प्रबंधन, स्वयंसेवक और अलर्ट प्रबंधित करें।",
    loginAsAdmin: "एडमिन के रूप में लॉगिन करें",
    
    safeWari: "सुरक्षित वारी",
    smartWari: "स्मार्ट वारी",
    blessedWari: "मंगलमय वारी",
    
    backToHome: "होम पर लौटें",
    signInHeading: "साइन इन",
    choosePortal: "आगे बढ़ने के लिए अपना पोर्टल चुनें",
    
    pilgrimSignInTitle: "वारकरी साइन इन",
    pilgrimWelcome: "वापसी पर स्वागत है, वारकरी!",
    mobileNumberLabel: "मोबाइल नंबर",
    mobileNumberPlaceholder: "मोबाइल नंबर दर्ज करें",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "पासवर्ड दर्ज करें",
    forgotPassword: "पासवर्ड भूल गए?",
    signInPilgrimBtn: "वारकरी के रूप में साइन इन करें",
    
    adminSignInTitle: "एडमिन साइन इन",
    adminWelcome: "वापसी पर स्वागत है, सेवा दल!",
    emailLabel: "ईमेल आईडी",
    emailPlaceholder: "ईमेल आईडी दर्ज करें",
    signInAdminBtn: "एडमिन के रूप में साइन इन करें",
    
    or: "या",
    continueWithGoogle: "गूगल के साथ जारी रखें",
    
    newHere: "नए हैं?",
    createPilgrimAccount: "वारकरी खाता बनाएं",
    needAdminAccount: "एडमिन खाता चाहिए?",
    requestAccess: "एक्सेस का अनुरोध करें",
    
    switchToAdminPortal: "एडमिन पोर्टल पर जाएं",
    switchToPilgrimPortal: "वारकरी पोर्टल पर जाएं",
    accountNotFoundPilgrim: "इस मोबाइल नंबर पर कोई खाता नहीं मिला। कृपया नया खाता बनाएं।",
    accountNotFoundAdmin: "इस ईमेल पर कोई एडमिन खाता नहीं मिला। कृपया एक्सेस का अनुरोध करें।",
    registerWithNumber: "इस नंबर से नया खाता बनाएं",
    requestWithEmail: "इस ईमेल से एक्सेस अनुरोध भेजें",
    roleMismatchNotice: "यह खाता दूसरे पोर्टल का है",
    
    aiAssistantTitle: "AI सहायक",
    aiAssistantDesc: "मराठी, हिंदी, अंग्रेजी में 24/7 सहायता",
    liveLocationTitle: "लाइव लोकेशन",
    liveLocationDesc: "नेविगेशन और रीयल-टाइम वारी अपडेट",
    emergencySosTitle: "आपातकालीन SOS",
    emergencySosDesc: "ज़रूरत पड़ने पर तुरंत मदद",
    smartAlertsTitle: "स्मार्ट अलर्ट",
    smartAlertsDesc: "मौसम, भीड़ और सुरक्षा अलर्ट",
  }
};
