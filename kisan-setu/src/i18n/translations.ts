export type Lang = "en" | "hi" | "te";

export const translations: Record<string, { en: string; hi: string; te: string }> = {
  // Nav
  "nav.home": { en: "Home", hi: "मुख्य", te: "హోమ్" },
  "nav.dashboard": { en: "Dashboard", hi: "डैशबोर्ड", te: "డాష్‌బోర్డ్" },
  "nav.admin": { en: "Admin Panel", hi: "प्रशासन पैनल", te: "నిర్వాహక ప్యానెల్" },
  "nav.login": { en: "Sign in", hi: "लॉगिन", te: "సైన్ ఇన్" },
  "nav.logout": { en: "Logout", hi: "लॉग आउट", te: "లాగ్ అవుట్" },
  "nav.map": { en: "Mandi Map", hi: "मंडी मानचित्र", te: "మార్కెట్ మ్యాప్" },
  "nav.track": { en: "Track Crop", hi: "उपज ट्रैक करें", te: "పంట ట్రాక్ చేయండి" },

  // Hero
  "hero.tag": { en: "Ministry of Consumer Affairs, Food & Public Distribution", hi: "उपभोक्ता मामले, खाद्य एवं सार्वजनिक वितरण मंत्रालय", te: "వినియోగదారుల వ్యవహారాలు, ఆహారం & ప్రజా పంపిణీ మంత్రిత్వ శాఖ" },
  "hero.badge": { en: "2026 · Smart Procurement Initiative", hi: "2026 · स्मार्ट खरीद पहल", te: "2026 · స్మార్ట్ కొనుగోలు కార్యక్రమం" },
  "hero.title1": { en: "Your harvest,", hi: "आपकी फसल,", te: "మీ పంట," },
  "hero.title2": { en: "delivered smart.", hi: "स्मार्ट तरीके से बिकी।", te: "స్మార్ట్‌గా విక్రయించండి." },
  "hero.sub": {
    en: "Kisan Setu bridges Indian farmers to government procurement centers — book your delivery slot, skip the queue, and get paid faster.",
    hi: "किसान सेतु भारतीय किसानों को सरकारी खरीद केंद्रों से जोड़ता है — डिलीवरी स्लॉट बुक करें, लंबी लाइन छोड़ें, और जल्दी भुगतान पाएं।",
    te: "కిసాన్ సేతు భారతీయ రైతులను ప్రభుత్వ కొనుగోలు కేంద్రాలతో కలుపుతుంది — డెలివరీ స్లాట్ బుక్ చేయండి, క్యూ దాటవేయండి, త్వరగా చెల్లింపు పొందండి.",
  },
  "hero.cta1": { en: "Book your slot", hi: "स्लॉट बुक करें", te: "మీ స్లాట్ బుక్ చేయండి" },
  "hero.cta2": { en: "See demo dashboard", hi: "डेमो डैशबोर्ड देखें", te: "డెమో డాష్‌బోర్డ్ చూడండి" },
  "hero.stat1k": { en: "Farmers onboarded", hi: "किसान जुड़े", te: "నమోదైన రైతులు" },
  "hero.stat2k": { en: "Procurement centers", hi: "खरीद केंद्र", te: "కొనుగోలు కేంద్రాలు" },
  "hero.stat3k": { en: "Avg. wait time cut", hi: "औसत प्रतीक्षा में कटौती", te: "సగటు నిరీక్షణ తగ్గుదల" },

  // Home sections
  "home.how.title": { en: "From field to fair price, in four simple steps", hi: "खेत से उचित मूल्य तक, चार आसान कदम", te: "పొలం నుండి న్యాయమైన ధర వరకు, నాలుగు సులభ దశలు" },
  "home.how.sub": { en: "A trust-first workflow designed for every Indian farmer.", hi: "हर भारतीय किसान के लिए भरोसे पर आधारित कार्यप्रणाली।", te: "ప్రతి భారతీయ రైతు కోసం నమ్మకంపై ఆధారపడిన విధానం." },
  "how.s1": { en: "Register once", hi: "एक बार पंजीकरण", te: "ఒకసారి నమోదు" },
  "how.s1d": { en: "Add your Aadhaar, crop and land details in under 2 minutes.", hi: "2 मिनट में अपना आधार, फसल और भूमि विवरण जोड़ें।", te: "2 నిమిషాల్లో మీ ఆధార్, పంట మరియు భూమి వివరాలు జోడించండి." },
  "how.s2": { en: "Pick a mandi & slot", hi: "मंडी और स्लॉट चुनें", te: "మార్కెట్ & స్లాట్ ఎంచుకోండి" },
  "how.s2d": { en: "See live queues and book a guaranteed window — no overnight waiting.", hi: "लाइव कतार देखें और गारंटीड समय बुक करें — रातभर इंतज़ार नहीं।", te: "లైవ్ క్యూలు చూడండి, హామీ సమయం బుక్ చేయండి — రాత్రి ఎదురుచూపు లేదు." },
  "how.s3": { en: "Deliver with your token", hi: "टोकन के साथ उपज पहुंचाएं", te: "మీ టోకెన్‌తో పంట అప్పగించండి" },
  "how.s3d": { en: "Show your SMS token at the gate. Staff mark you arrived in real time.", hi: "गेट पर अपना SMS टोकन दिखाएं। कर्मचारी आपकी उपस्थिति वास्तविक समय में दर्ज करें।", te: "గేటు వద్ద మీ SMS టోకెన్ చూపండి. సిబ్బంది మీ రాకను నిజ సమయంలో నమోదు చేస్తారు." },
  "how.s4": { en: "Get graded & paid", hi: "ग्रेडिंग और भुगतान", te: "గ్రేడింగ్ & చెల్లింపు" },
  "how.s4d": { en: "Transparent grading at MSP, with payment pushed straight to your bank.", hi: "MSP पर पारदर्शी ग्रेडिंग, भुगतान सीधे आपके बैंक में।", te: "MSP వద్ద పారదర్శక గ్రేడింగ్, చెల్లింపు నేరుగా మీ బ్యాంకుకు." },

  // Features
  "home.features.title": { en: "Everything your village needs", hi: "आपके गाँव के लिए सब कुछ", te: "మీ గ్రామానికి కావాల్సినవి అన్నీ" },
  "home.features.sub": { en: "Purpose-built for rural India — simple, offline-tolerant and in your language.", hi: "ग्रामीण भारत के लिए बनाया गया — सरल, हिंदी में।", te: "గ్రామీణ భారతదేశం కోసం రూపొందించబడింది — సరళం, మీ భాషలో." },
  "feat.slot": { en: "Slot booking", hi: "स्लॉट बुकिंग", te: "స్లాట్ బుకింగ్" },
  "feat.slotd": { en: "Guaranteed time windows kill the overnight queue forever.", hi: "गारंटीड समय के साथ रातभर की कतार हमेशा के लिए खत्म।", te: "హామీ సమయ విండోలు రాత్రి క్యూను శాశ్వతంగా తొలగిస్తాయి." },
  "feat.live": { en: "Live tracking", hi: "लाइव ट्रैकिंग", te: "లైవ్ ట్రాకింగ్" },
  "feat.lived": { en: "See queue length & your produce status, second by second.", hi: "कतार की लंबाई और आपकी उपज की स्थिति, पल-पल देखें।", te: "క్యూ పొడవు & మీ పంట స్థితిని సెకనుకు సెకను చూడండి." },
  "feat.notif": { en: "SMS & app alerts", hi: "SMS और ऐप अलर्ट", te: "SMS & యాప్ హెచ్చరికలు" },
  "feat.notifd": { en: "Slots, schedule changes and payments — notified in your language.", hi: "स्लॉट, शेड्यूल और भुगतान — आपकी भाषा में सूचनाएं।", te: "స్లాట్లు, షెడ్యూల్ మార్పులు, చెల్లింపులు — మీ భాషలో తెలియజేయబడతాయి." },
  "feat.map": { en: "Mandi map", hi: "मंडी मानचित्र", te: "మార్కెట్ మ్యాప్" },
  "feat.mapd": { en: "Nearest centers with live load, distance and timings.", hi: "निकटतम केंद्र, लाइव लोड, दूरी और समय के साथ।", te: "సమీప కేంద్రాలు లైవ్ లోడ్, దూరం, సమయాలతో." },
  "feat.admin": { en: "Center panel", hi: "केंद्र पैनल", te: "కేంద్ర ప్యానెల్" },
  "feat.admind": { en: "Staff updates queues, grading and capacity in one tap.", hi: "कर्मचारी एक टैप में कतार, ग्रेडिंग और क्षमता अपडेट करें।", te: "సిబ్బంది ఒక ట్యాప్‌లో క్యూ, గ్రేడింగ్, సామర్థ్యం నవీకరిస్తారు." },

  // Labels
  "label.language": { en: "Language", hi: "भाषा", te: "భాష" },
  "label.english": { en: "English", hi: "English", te: "English" },
  "label.hindi": { en: "हिन्दी", hi: "हिन्दी", te: "हिन्दी" },

  // Auth
  "auth.login.title": { en: "Welcome back", hi: "वापसी पर स्वागत", te: "తిరిగి స్వాగతం" },
  "auth.login.sub": { en: "Sign in with your registered mobile number.", hi: "अपने पंजीकृत मोबाइल नंबर से लॉगिन करें।", te: "మీ నమోదిత మొబైల్ నంబర్‌తో సైన్ ఇన్ చేయండి." },
  "auth.phone": { en: "Mobile number", hi: "मोबाइल नंबर", te: "మొబైల్ నంబర్" },
  "auth.otp": { en: "6-digit OTP", hi: "6 अंकों का OTP", te: "6 అంకెల OTP" },
  "auth.sendOtp": { en: "Send OTP", hi: "OTP भेजें", te: "OTP పంపండి" },
  "auth.verifying": { en: "Verifying…", hi: "सत्यापन जारी…", te: "ధృవీకరిస్తోంది…" },
  "auth.loginBtn": { en: "Sign in with OTP", hi: "OTP से लॉगिन करें", te: "OTPతో సైన్ ఇన్" },
  "auth.noAcc": { en: "New farmer? Register your kisan profile.", hi: "नए किसान? अपनी किसान प्रोफ़ाइल बनाएं।", te: "కొత్త రైతా? మీ రైతు ప్రొఫైల్ నమోదు చేయండి." },
  "auth.registerLink": { en: "Register free", hi: "मुफ़्त पंजीकरण", te: "ఉచిత నమోదు" },
  "auth.otpHint": { en: "Prototype hint: any 6-digit OTP works", hi: "प्रोटोटाइप: कोई भी 6 अंक OTP मान्य", te: "ప్రోటోటైప్: ఏదైనా 6 అంకెల OTP పనిచేస్తుంది" },

  "reg.title": { en: "Register your kisan profile", hi: "अपनी किसान प्रोफ़ाइल बनाएं", te: "మీ రైతు ప్రొఫైల్ నమోదు చేయండి" },
  "reg.sub": { en: "One-time setup. Takes less than 2 minutes.", hi: "एक बार का सेटअप। 2 मिनट से भी कम।", te: "ఒకసారి సెటప్. 2 నిమిషాల కంటే తక్కువ." },
  "reg.name": { en: "Full name", hi: "पूरा नाम", te: "పూర్తి పేరు" },
  "reg.crop": { en: "Primary crop", hi: "मुख्य फसल", te: "ప్రధాన పంట" },
  "reg.land": { en: "Land size", hi: "भूमि का आकार", te: "భూమి విస్తీర్ణం" },
  "reg.landPlaceholder": { en: "e.g. 4.5 acres", hi: "जैसे 4.5 एकड़", te: "ఉదా. 4.5 ఎకరాలు" },
  "reg.aadhaar": { en: "Aadhaar / Farmer ID", hi: "आधार / किसान आईडी", te: "ఆధార్ / రైతు ఐడీ" },
  "reg.village": { en: "Village & district", hi: "गाँव और जिला", te: "గ్రామం & జిల్లా" },
  "reg.submit": { en: "Create my kisan account", hi: "मेरा किसान खाता बनाएं", te: "నా రైతు ఖాతా సృష్టించండి" },
  "reg.have": { en: "Already registered?", hi: "पहले से पंजीकृत?", te: "ఇప్పటికే నమోదయ్యారా?" },
  "reg.loginLink": { en: "Sign in", hi: "लॉगिन करें", te: "సైన్ ఇన్" },
  "reg.otpHint": { en: "Aadhaar number is masked for privacy (demo).", hi: "गोपनीयता हेतु आधार नंबर मास्क किया गया है (डेमो)।", te: "గోప్యత కోసం ఆధార్ నంబర్ మాస్క్ చేయబడింది (డెమో)." },

  // Dashboard
  "dash.welcome": { en: "Welcome back,", hi: "वापसी पर स्वागत,", te: "తిరిగి స్వాగతం," },
  "dash.slotsLeft": { en: "slots left today", hi: "स्लॉट आज शेष", te: "ఈరోజు మిగిలిన స్లాట్లు" },
  "dash.nearby": { en: "Nearby procurement centers", hi: "आस-पास के खरीद केंद्र", te: "సమీప కొనుగోలు కేంద్రాలు" },
  "dash.bookNotice": { en: "Book early — high-load mandis may exhaust slots by noon.", hi: "जल्दी बुक करें — व्यस्त मंडियों में दोपहर तक स्लॉट खत्म हो सकते हैं।", te: "ముందుగా బుక్ చేయండి — రద్దీ మార్కెట్లలో మధ్యాహ్నానికి స్లాట్లు అయిపోవచ్చు." },
  "dash.queued": { en: "in queue", hi: "कतार में", te: "క్యూలో" },
  "dash.estWait": { en: "est. wait", hi: "अनुमानित प्रतीक्षा", te: "అంచనా నిరీక్షణ" },
  "dash.kmt": { en: "km", hi: "किमी", te: "కి.మీ." },
  "dash.book": { en: "Book slot", hi: "स्लॉट बुक करें", te: "స్లాట్ బుక్ చేయండి" },
  "dash.arrive": { en: "Navigate", hi: "रास्ता देखें", te: "నావిగేట్" },
  "dash.mspTitle": { en: "Today's MSP rates", hi: "आज की MSP दरें", te: "ఈరోజు MSP ధరలు" },
  "dash.queueToday": { en: "Live queue", hi: "लाइव कतार", te: "లైవ్ క్యూ" },
  "dash.capacity": { en: "today's capacity", hi: "आज की क्षमता", te: "ఈరోజు సామర్థ్యం" },
  "dash.open": { en: "Open today", hi: "आज खुला", te: "ఈరోజు తెరిచి ఉంది" },
  "dash.to": { en: "to", hi: "से", te: "నుండి" },

  // Booking modal
  "book.title": { en: "Book a delivery slot", hi: "डिलीवरी स्लॉट बुक करें", te: "డెలివరీ స్లాట్ బుక్ చేయండి" },
  "book.choice": { en: "Select your time window", hi: "अपना समय चुनें", te: "మీ సమయాన్ని ఎంచుకోండి" },
  "book.remaining": { en: "left", hi: "शेष", te: "మిగిలి" },
  "book.fill": { en: "Full", hi: "भरा हुआ", te: "నిండింది" },
  "book.qty": { en: "Quantity (tonnes)", hi: "मात्रा (टन)", te: "పరిమాణం (టన్నులు)" },
  "book.crop": { en: "Crop", hi: "फसल", te: "పంట" },
  "book.tokenNote": { en: "Token will be sent by SMS on confirmation.", hi: "पुष्टि पर टोकन SMS से भेजा जाएगा।", te: "నిర్ధారణపై టోకెన్ SMS ద్వారా పంపబడుతుంది." },
  "book.confirm": { en: "Confirm booking", hi: "बुकिंग पक्की करें", te: "బుకింగ్ నిర్ధారించండి" },
  "book.confirmed": { en: "Slot booked!", hi: "स्लॉट बुक हो गया!", te: "స్లాట్ బుక్ అయింది!" },
  "book.confirmedMsg": { en: "Your token has been issued. Show it at the mandi gate.", hi: "आपका टोकन जारी हो गया। इसे मंडी गेट पर दिखाएं।", te: "మీ టోకెన్ జారీ అయింది. మార్కెట్ గేటు వద్ద చూపండి." },
  "book.done": { en: "Done", hi: "हो गया", te: "పూర్తయింది" },

  // Tracker
  "track.title": { en: "Live status tracker", hi: "लाइव स्थिति ट्रैकर", te: "లైవ్ స్థితి ట్రాకర్" },
  "track.token": { en: "Token", hi: "टोकन", te: "టోకెన్" },
  "track.crop": { en: "Crop", hi: "फसल", te: "పంట" },
  "track.qty": { en: "Quantity", hi: "मात्रा", te: "పరిమాణం" },
  "track.slot": { en: "Slot", hi: "स्लॉट", te: "స్లాట్" },
  "track.estWhen": { en: "est. completion", hi: "अनुमानित पूर्णता", te: "అంచనా పూర్తి" },
  "track.queuePos": { en: "Your position in queue", hi: "कतार में आपकी स्थिति", te: "క్యూలో మీ స్థానం" },
  "track.processing": { en: "In progress", hi: "प्रगति पर", te: "జరుగుతోంది" },
  "track.refresh": { en: "Refresh", hi: "रिफ्रेश करें", te: "రిఫ్రెష్" },
  "track.updated": { en: "Live · updated just now", hi: "लाइव · अभी अपडेट हुआ", te: "లైవ్ · ఇప్పుడే నవీకరించబడింది" },
  "track.prevText": { en: "Previous", hi: "पिछला", te: "మునుపటి" },
  "track.nextText": { en: "Next", hi: "अगला", te: "తదుపరి" },
  "track.noBooking": { en: "No active procurement yet.", hi: "अभी कोई सक्रिय खरीद नहीं।", te: "ఇంకా క్రియాశీల కొనుగోలు లేదు." },
  "track.estPay": { en: "Estimated payout at ₹/quintal", hi: "अनुमानित भुगतान (₹/क्विंटल)", te: "అంచనా చెల్లింపు (₹/క్వింటాల్)" },
  "track.sms": { en: "SMS", hi: "एसएमएस", te: "ఎస్ఎంఎస్" },
  "track.rebook": { en: "Re-book slot", hi: "फिर से स्लॉट बुक करें", te: "మళ్లీ స్లాట్ బుక్ చేయండి" },

  // Notifications
  "notif.title": { en: "Notifications", hi: "सूचनाएं", te: "నోటిఫికేషన్లు" },
  "notif.empty": { en: "You're all caught up.", hi: "सभी सूचनाएं पढ़ ली गई हैं।", te: "అన్నీ చదివేశారు." },
  "notif.markAll": { en: "Mark all read", hi: "सभी पढ़ी हुई मार्क करें", te: "అన్నీ చదివినట్లు గుర్తించండి" },
  "notif.smsNote": { en: "SMS gateway will mirror these alerts to your mobile.", hi: "SMS गेटवे इन सूचनाओं को आपके मोबाइल पर भेजेगा।", te: "SMS గేట్వే ఈ హెచ్చరికలను మీ మొబైల్‌కు పంపుతుంది." },

  // Admin
  "admin.title": { en: "Procurement center panel", hi: "खरीद केंद्र पैनल", te: "కొనుగోలు కేంద్ర ప్యానెల్" },
  "admin.center": { en: "Center", hi: "केंद्र", te: "కేంద్రం" },
  "admin.capacityTitle": { en: "Daily intake & capacity", hi: "दैनिक आवक और क्षमता", te: "రోజువారీ సేకరణ & సామర్థ్యం" },
  "admin.capacityHelp": { en: "Adjust today's intake target in tonnes.", hi: "आज का लक्ष्य (टन में) समायोजित करें।", te: "ఈరోజు లక్ష్యాన్ని (టన్నుల్లో) సర్దుబాటు చేయండి." },
  "admin.queueTitle": { en: "Queue overview", hi: "कतार अवलोकन", te: "క్యూ అవలోకనం" },
  "admin.markArrived": { en: "Mark arrived", hi: "पहुंचा मार्क करें", te: "రాక నమోదు" },
  "admin.inCheck": { en: "In inspection", hi: "निरीक्षण में", te: "పరిశీలనలో" },
  "admin.markDone": { en: "Complete", hi: "पूर्ण", te: "పూర్తి" },
  "admin.incoming": { en: "Incoming now", hi: "अभी आने वाले", te: "ఇప్పుడు వస్తున్నవి" },
  "admin.today": { en: "Today's arrivals", hi: "आज की आवक", te: "ఈరోజు రాకలు" },
  "admin.gradeTitle": { en: "Grading station", hi: "ग्रेडिंग स्टेशन", te: "గ్రేడింగ్ స్టేషన్" },
  "admin.gradeHelp": { en: "Grade scanned lots. 'A' grade clears at full MSP.", hi: "स्कैन की गई लॉट्स की ग्रेडिंग करें। 'A' ग्रेड पूर्ण MSP पर।", te: "స్కాన్ చేసిన లాట్లను గ్రేడ్ చేయండి. 'A' గ్రేడ్ పూర్తి MSP వద్ద." },
  "admin.gradeSubmit": { en: "Save grade", hi: "ग्रेड सहेजें", te: "గ్రేడ్ సేవ్" },
  "admin.farmer": { en: "Farmer", hi: "किसान", te: "రైతు" },
  "admin.arrived": { en: "Arrived", hi: "पहुंचे", te: "చేరారు" },
  "admin.queuePos": { en: "Pos.", hi: "स्थान", te: "స్థానం" },
  "admin.lot": { en: "Lot", hi: "लॉट", te: "లాట్" },
  "admin.paddy": { en: "Paddy", hi: "धान", te: "వరి" },
  "admin.maize": { en: "Maize", hi: "मक्का", te: "మొక్కజొన్న" },
  "admin.waiting": { en: "waiting", hi: "प्रतीक्षा कर रहे", te: "నిరీక్షిస్తున్నారు" },
  "admin.todayCapacity": { en: "Set today's capacity", hi: "आज की क्षमता तय करें", te: "ఈరోజు సామర్థ్యం నిర్ణయించండి" },
  "admin.saveCapacity": { en: "Update capacity", hi: "क्षमता अपडेट", te: "సామర్థ్యం నవీకరించండి" },

  // Map
  "map.title": { en: "Find a mandi near you", hi: "अपने पास मंडी ढूंढें", te: "మీ దగ్గర మార్కెట్ కనుగొనండి" },
  "map.sub": { en: "Live load, wait times and timings for every center.", hi: "हर केंद्र का लाइव लोड, प्रतीक्षा और समय।", te: "ప్రతి కేంద్రానికి లైవ్ లోడ్, నిరీక్షణ సమయాలు." },
  "map.select": { en: "Select a center for details", hi: "विवरण के लिए केंद्र चुनें", te: "వివరాల కోసం కేంద్రాన్ని ఎంచుకోండి" },
  "map.legendLow": { en: "Low load", hi: "कम लोड", te: "తక్కువ లోడ్" },
  "map.legendMed": { en: "Medium", hi: "मध्यम", te: "మధ్యస్థం" },
  "map.legendHigh": { en: "High load", hi: "उच्च लोड", te: "ఎక్కువ లోడ్" },
  "map.open": { en: "Open", hi: "खुला", te: "తెరిచి" },
  "map.intro": { en: "How loaded is every mandi right now?", hi: "अभी हर मंडी कितनी व्यस्त है?", te: "ఇప్పుడు ప్రతి మార్కెట్ ఎంత రద్దీగా ఉంది?" },

  // General
  "gen.close": { en: "Close", hi: "बंद करें", te: "మూసివేయండి" },
  "gen.save": { en: "Save", hi: "सहेजें", te: "సేవ్" },
  "gen.cancel": { en: "Cancel", hi: "रद्द करें", te: "రద్దు" },
  "gen.back": { en: "Back", hi: "वापस", te: "వెనుకకు" },
  "gen.loading": { en: "Loading…", hi: "लोड हो रहा…", te: "లోడ్ అవుతోంది…" },
  "gen.update": { en: "Update", hi: "अपडेट", te: "నవీకరించండి" },
  "gen.viewAll": { en: "View all", hi: "सभी देखें", te: "అన్నీ చూడండి" },
  "gen.today": { en: "Today", hi: "आज", te: "ఈరోజు" },
  "gen.demoNote": { en: "Hackathon prototype · SIH 2026 · sample data", hi: "हैकाथॉन प्रोटोटाइप · SIH 2026 · नमूना डेटा", te: "హాకథాన్ ప్రోటోటైప్ · SIH 2026 · నమూనా డేటా" },

  // Footer
  "ft.title": { en: "Kisan Setu is an open platform.", hi: "किसान सेतु एक खुला मंच है।", te: "కిసాన్ సేతు ఒక ఓపెన్ వేదిక." },
  "ft.sub": { en: "Built with farmers, for farmers — under the Ministry of Consumer Affairs, Food & Public Distribution.", hi: "किसानों के लिए, किसानों के साथ — उपभोक्ता मामले, खाद्य एवं सार्वजनिक वितरण मंत्रालय के अंतर्गत।", te: "రైతుల కోసం, రైతులతో నిర్మించబడింది — వినియోగదారుల వ్యవహారాలు, ఆహారం & ప్రజా పంపిణీ మంత్రిత్వ శాఖ ఆధ్వర్యంలో." },
  "ft.links": { en: "Platform", hi: "प्लेटफ़ॉर्म", te: "వేదిక" },
  "ft.help": { en: "Help & support", hi: "सहायता", te: "సహాయం & మద్దతు" },
  "ft.helpline": { en: "Helpline", hi: "हेल्पलाइन", te: "హెల్ప్‌లైన్" },
  "ft.faq": { en: "FAQ", hi: "पूछे जाने वाले प्रश्न", te: "తరచుగా అడిగే ప్రశ్నలు" },
  "ft.msp": { en: "MSP rates", hi: "MSP दरें", te: "MSP ధరలు" },
  "ft.rights": { en: "A hackathon prototype for Smart India Hackathon 2026.", hi: "स्मार्ट इंडिया हैकाथॉन 2026 हेतु प्रोटोटाइप।", te: "స్మార్ట్ ఇండియా హాకథాన్ 2026 కోసం ప్రోటోటైప్." },
};

export const langMeta: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "te", label: "తెలుగు", native: "తెలుగు" },
  { code: "hi", label: "हिन्दी", native: "हिन्दी" },
];

/** Pick the right translation string based on language */
export function pickLang(lang: Lang, en: string, hi: string, te: string): string {
  if (lang === "hi") return hi;
  if (lang === "te") return te;
  return en;
}