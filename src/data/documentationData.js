export const docTranslations = {
  en: {
    header: {
      title: "Parivar System Documentation",
      subtitle: "Comprehensive guide to architecture, role-based workflows, administrative controls, and system modules.",
      languageLabel: "Language",
      versionBadge: "v2.0 • Live Architecture",
      searchPlaceholder: "Search documentation sections, tables, features...",
      printBtn: "Print / Save PDF"
    },
    nav: {
      overview: "Introduction",
      dashboard: "Dashboard Overview",
      members: "Family Registry (Members)",
      committee: "Committee Leadership",
      roles: "Roles & Permission Matrix",
      activities: "Activities (4-in-1)",
      services: "Services (3-in-1)",
      media: "Media & Broadcast",
      engagements: "Finance & Engagement",
      masters: "Master Data Config",
      settings: "Branding & Appearance"
    },
    sections: {
      overview: {
        welcomeTitle: "Welcome to Parivar Portal!",
        welcomeSubtitle: "Complete community & family organizational management system.",
        whyTitle: "Why Parivar Platform?",
        whyPoints: [
          { title: "Centralized Family Tree & Member Directory", desc: "Head-of-family mapping, relationship trees, member profiles, and emergency blood group registry." },
          { title: "Executive Committee Governance", desc: "Designate President, Secretary, and department heads with granular role-based permissions." },
          { title: "Community Activities & News Feeds", desc: "Publish gatherings, annual meetings, announcements, and achievement honors." },
          { title: "Business & Matrimonial Services", desc: "Verified member enterprise listings and confidential matrimonial biodata exchange." },
          { title: "Transparent Financial Ledgers", desc: "Live donation records and audited expense vouchers categorized by committee." },
          { title: "Multilingual & Instant Notifications", desc: "Seamless support for English, Hindi, and Gujarati with real-time push alerts." }
        ],
        supportTitle: "Contact & Support",
        website: "https://parivar.me",
        email: "support@parivar.org",
        phone: "+91 88667 79008",
        setupProgressTitle: "Quick Setup Guide",
        setupSteps: [
          {
            stepNum: "01",
            title: "Configure Master Data",
            desc: "Set up Country, State, City, Village hierarchy and professional categories before registering families.",
            tag: "10-in-1 Masters",
            time: "Step 1"
          },
          {
            stepNum: "02",
            title: "Define Roles & Access Permissions",
            desc: "Set granular read/write privileges for Committee members, Sub-Admins, and Department heads.",
            tag: "RBAC Security",
            time: "Step 2"
          },
          {
            stepNum: "03",
            title: "Register Community Members & Families",
            desc: "Add family heads, link relationship tree (spouse, children), emergency blood group, and photos.",
            tag: "Member Directory",
            time: "Step 3"
          },
          {
            stepNum: "04",
            title: "Assign Executive Committee Leadership",
            desc: "Elect President, Secretary, Treasurer, and Youth Wing leads with tenures and responsibilities.",
            tag: "Governance",
            time: "Step 4"
          },
          {
            stepNum: "05",
            title: "Launch Community Activities & Services",
            desc: "Publish social events, achievement honors, verified business directory, and confidential matrimony.",
            tag: "7-in-1 Modules",
            time: "Step 5"
          },
          {
            stepNum: "06",
            title: "Financial Ledgers & Brand Settings",
            desc: "Manage live donation vouchers, expense ledgers, and personalize platform theme colors & logos.",
            tag: "Ledgers & Themes",
            time: "Step 6"
          }
        ]
      },
      dashboard: {
        title: "2. Dashboard & Real-Time Analytics",
        badge: "Overview & Analytics",
        image: "/documention/Screenshot 2026-08-25 142830.png",
        imageCaption: "Live Dashboard: Metric KPIs, monthly growth trends, category breakdown, and live activity streams.",
        features: [
          {
            title: "Total Members & Family Count",
            desc: "Live counter showing total registered community members, active families, and new registrations."
          },
          {
            title: "Registered Businesses & Directory",
            desc: "Summary of community-owned businesses, enterprise listings, and active service providers."
          },
          {
            title: "Community Posts & Events",
            desc: "Quick snapshot of published social feeds, upcoming gatherings, meetings, and festival announcements."
          },
          {
            title: "Monthly Growth Charts & Trends",
            desc: "Interactive visual charts showcasing monthly member onboardings and business category distribution."
          }
        ]
      },
      members: {
        title: "3. Family Registry & Member Directory",
        badge: "Core Directory",
        image: "/documention/member.png",
        imageCaption: "Family Registry: Comprehensive member listings with family head hierarchy tags, search, and action controls.",
        modalImage: "/documention/Screenshot 2026-08-25 143152.png",
        modalCaption: "Add Member Modal: Multi-field form including personal details, family hierarchy, geographic cascade, and avatar upload.",
        points: [
          "Hierarchical Tree Structure: Distinguishes 'Family Head' (Self) from dependants (Spouse, Son, Daughter, Parents).",
          "Cascading Geographic Selectors: Country ➔ State ➔ City ➔ Village master dropdown filtering.",
          "Approval Lifecycle: Active/Inactive switch allows instant suspension or directory approval.",
          "Emergency Information: Blood group indexes, birthdates, and anniversary reminders."
        ]
      },
      committee: {
        title: "4. Committee Leadership & Governance",
        badge: "Administration",
        modalImage: "/documention/committeememberadd.png",
        modalCaption: "Add Committee Member Dialog: Photo upload (max 1MB), contact info, custom designation, and Role selection.",
        points: [
          "Executive Board Management: President, Vice President, Secretary, Treasurer, and Executive Members.",
          "Dedicated Login Credentials: Role-assigned committee members receive secured dashboard access credentials.",
          "Image Upload Standards: Enforces 300x300px image standard with 1MB maximum payload safety limits."
        ]
      },
      roles: {
        title: "5. Roles & Granular Permission Matrix",
        badge: "Access Governance",
        image: "/documention/role.png",
        imageCaption: "Role Management Index: List of defined privilege packages with active status toggles.",
        modalImage: "/documention/roleform.png",
        modalCaption: "Role Matrix Editor: Checkbox grid permitting fine-grained List, Add, Edit, Delete permissions per module.",
        points: [
          "Module-by-Action Grid: 18 distinct functional modules each with [List, Add, Edit, Delete] toggles.",
          "Super Admin Bypass: President and Super Admin roles automatically inherit full unrestricted system access.",
          "Instant Revocation: Disabling a role immediately forbids unauthorized API requests across the system."
        ]
      },
      activities: {
        title: "6. Activities Module (4-in-1 Unified Tab System)",
        badge: "Activities Tab",
        image: "/documention/activitytab.png",
        imageCaption: "Activities Hub: Gallery, Birthdays, Job Vacancies, and Events consolidated into a single unified tab layout.",
        tabs: [
          { name: "Gallery", desc: "Upload and categorize festival photos, event pictures, and historical community archives with multi-image support." },
          { name: "Birthdays", desc: "Automated community birthday calendar tracking upcoming member milestones with notification triggers." },
          { name: "Job Vacancies", desc: "Community employment exchange for posting openings, requirements, applicant screening, and direct contact." },
          { name: "Events", desc: "Organize cultural events, RSVP attendee registrations, ticketing types (Free/Paid), and venue maps." }
        ]
      },
      services: {
        title: "7. Services Module (3-in-1 Unified Tab System)",
        badge: "Services Tab",
        image: "/documention/servicestab.png",
        imageCaption: "Services Hub: Businesses, Students, and Matrimonial registries conveniently accessible from one screen.",
        tabs: [
          { name: "Businesses", desc: "Directory of member-owned businesses, contact information, website links, catalog images, and category classification." },
          { name: "Students", desc: "Academic recognition portal recording student standards, percentages, awards, and educational incentives." },
          { name: "Matrimonies", desc: "Confidential matrimonial biodata registry with verified marital status, profession, education, and family background." }
        ]
      },
      media: {
        title: "8. Media & Content Moderation (3-in-1 Tab System)",
        badge: "Media Hub",
        image: "/documention/mediatab.png",
        imageCaption: "Media Hub: Community Posts, News Releases, and Member Feedback with instant moderation controls.",
        tabs: [
          { name: "Posts", desc: "Community message board, announcement cards, and interactive updates with status publishing." },
          { name: "News", desc: "Official press releases, samaj circulars, and executive announcements with image attachments." },
          { name: "Feedback", desc: "Direct citizen feedback inbox for grievance redressal, feature suggestions, and inquiries." }
        ]
      },
      engagements: {
        title: "9. Engagements & Financial Records (2-in-1 Tab System)",
        badge: "Financial Records",
        image: "/documention/engagementtab.png",
        imageCaption: "Engagements Hub: Audited Expense Vouchers and Philanthropic Donations ledger with CSV export capabilities.",
        tabs: [
          { name: "Expenses", desc: "Tracks community expenditure categories (Electricity, Office Supplies, Event Logistics, Salaries) tagged to responsible committee members." },
          { name: "Donations", desc: "Philanthropic fund ledger with donor recognition, purpose allocations, receipt tracking, and public acknowledgement." }
        ]
      },
      masters: {
        title: "10. Master Data Configuration",
        badge: "Masters Hub",
        image: "/documention/mastertab.png",
        imageCaption: "Masters Hub: Global reference tables for Countries, States, Cities, Villages, Blood Groups, and Categories.",
        points: [
          "Horizontal Scroll Tab System: Smooth navigation across 10 Master tables (Business, Bank Details, Country, State, City, Village, Blood Group, Event Category, Gallery Category, Expense Category).",
          "Dynamic Form Synchronization: Any entry created here immediately populates all dropdown selectors in Add/Edit forms across the portal.",
          "Status Switches: Enable or disable master options on the fly without deleting legacy records."
        ]
      },
      settings: {
        title: "11. Appearance & Dynamic Brand Customizer",
        badge: "Theme Customizer",
        points: [
          "Live Color Picker: Dynamic variables engine for primary, hover, border, and glow accents.",
          "Public Website Branding: Controls logos, favicon, contact telephone, email, and social media handles (Facebook, WhatsApp, Instagram, YouTube).",
          "Dark / Light Mode: Intelligent theme switching with persistent localStorage cache."
        ]
      }
    }
  },

  hi: {
    header: {
      title: "परिवार सिस्टम संपूर्ण दस्तावेज़ीकरण (Documentation)",
      subtitle: "सिस्टम आर्किटेक्चर, भूमिका-आधारित कार्यप्रवाह, प्रशासनिक नियंत्रण और सभी मॉड्यूल्स की विस्तृत मार्गदर्शिका।",
      languageLabel: "भाषा चुनें",
      versionBadge: "संस्करण 2.0 • लाइव",
      searchPlaceholder: "दस्तावेज़, तालिकाएं, फीचर्स खोजें...",
      printBtn: "प्रिंट / PDF सहेजें"
    },
    nav: {
      overview: "परिचय (Introduction)",
      auth: "प्रमाणीकरण व सुरक्षा",
      dashboard: "एनालिटिक्स व डैशबोर्ड",
      members: "परिवार निर्देशिका (सदस्य)",
      committee: "समिति प्रबंधन",
      roles: "भूमिकाएं व अनुमतियाँ",
      activities: "गतिविधियां (4-इन-1)",
      services: "सेवाएं (3-इन-1)",
      media: "मीडिया व सामग्री",
      engagements: "वित्त व दान रिकॉर्ड",
      masters: "मास्टर डेटा कॉन्फ़िगरेशन",
      settings: "थीम व सेटिंग्स"
    },
    sections: {
      overview: {
        welcomeTitle: "परिवार पोर्टल में आपका स्वागत है!",
        welcomeSubtitle: "सम्पूर्ण समाज एवं पारिवारिक संगठन प्रबंधन प्रणाली।",
        whyTitle: "परिवार प्लेटफ़ॉर्म क्यों?",
        whyPoints: [
          { title: "केंद्रीकृत वंशावली व सदस्य निर्देशिका", desc: "परिवार के मुखिया, पारिवारिक संबंध, रक्त समूह इंडेक्स और सदस्य प्रोफाइल का पूर्ण प्रबंधन।" },
          { title: "कार्यकारी समिति व नेतृत्व व्यवस्था", desc: "अध्यक्ष, सचिव और विभागीय प्रमुखों को भूमिका-आधारित विस्तृत अनुमतियों का आवंटन।" },
          { title: "सामाजिक गतिविधियां व समाचार", desc: "वार्षिक सम्मेलन, कार्यक्रम, बैठकें और समाज की उपलब्धियों का त्वरित प्रकाशन।" },
          { title: "व्यावसायिक व वैवाहिक सेवाएं", desc: "सत्यापित समाज उद्यम निर्देशिका और सुरक्षित वैवाहिक बायोडाटा आदान-प्रदान।" },
          { title: "पारदर्शी वित्तीय बहीखाता (लेजर)", desc: "दान रसीदें और समिति-वार प्रमाणित व्यय वाउचर का सुरक्षित व पारदर्शी रिकॉर्ड।" },
          { title: "त्रिभाषी व रियल-टाइम नोटिफिकेशन", desc: "हिंदी, गुजराती और अंग्रेजी में तत्काल सूचनाएं व सहज संचालन।" }
        ],
        supportTitle: "संपर्क व सहायता",
        website: "https://parivar.me",
        email: "support@parivar.org",
        phone: "+91 88667 79008",
        setupProgressTitle: "त्वरित शुरुआत गाइड",
        setupSteps: [
          {
            stepNum: "01",
            title: "मास्टर डेटा कॉन्फ़िगर करें",
            desc: "परिवारों को पंजीकृत करने से पहले देश, राज्य, शहर, गाँव और व्यवसाय श्रेणियां व्यवस्थित करें।",
            tag: "10-इन-1 मास्टर्स",
            time: "चरण 1"
          },
          {
            stepNum: "02",
            title: "भूमिकाएं और अनुमतियाँ निर्धारित करें",
            desc: "समिति सदस्यों, सब-एडमिन और विभागीय प्रमुखों के लिए अधिकार व नियंत्रण तय करें।",
            tag: "सुरक्षा नियंत्रण",
            time: "चरण 2"
          },
          {
            stepNum: "03",
            title: "परिवार और समाज सदस्य पंजीकृत करें",
            desc: "परिवार के मुखिया, पारिवारिक संबंध, रक्त समूह इंडेक्स और फ़ोटो जोड़ें।",
            tag: "सदस्य निर्देशिका",
            time: "चरण 3"
          },
          {
            stepNum: "04",
            title: "कार्यकारी समिति नेतृत्व नियुक्त करें",
            desc: "अध्यक्ष, सचिव, कोषाध्यक्ष और युवा विंग प्रमुखों को पद और जिम्मेदारियां सौंपें।",
            tag: "समिति प्रबंधन",
            time: "चरण 4"
          },
          {
            stepNum: "05",
            title: "गतिविधियां और सेवाएं प्रकाशित करें",
            desc: "सामाजिक कार्यक्रम, उपलब्धियां, व्यावसायिक निर्देशिका और वैवाहिक विवरण शुरू करें।",
            tag: "7-इन-1 सेवाएं",
            time: "चरण 5"
          },
          {
            stepNum: "06",
            title: "वित्तीय लेजर व थीम सेटिंग्स",
            desc: "दान रिकॉर्ड, व्यय वाउचर प्रबंधित करें और पोर्टल के रंग-रूप को अनुकूलित करें।",
            tag: "लेजर व सेटिंग्स",
            time: "चरण 6"
          }
        ]
      },
      auth: {
        title: "2. प्रमाणीकरण एवं अभिगम नियंत्रण (Auth Flow)",
        badge: "सुरक्षा",
        description: "शून्य-विश्वास, भूमिका-आधारित सुरक्षा जो एडमिन डैशबोर्ड क्रेडेंशियल्स को मोबाइल ऐप के ओटीपी लॉगिन से अलग रखती है।",
        adminLoginTitle: "एडमिन एवं समिति लॉगिन प्रक्रिया",
        adminLoginSteps: [
          "एडमिन /login इंटरफ़ेस पर पंजीकृत ईमेल और पासवर्ड दर्ज करता है।",
          "बैकएंड पहले CommitteeMember संग्रह में स्थिति और पासवर्ड हैश (bcrypt) की जांच करता है।",
          "यदि नहीं मिलता, तो User संग्रह में व्यवस्थापक समिति पात्रता और अनुमतियों की जांच करता है।",
          "24 घंटे वैध हस्ताक्षरित JWT टोकन उत्पन्न करता है जिसमें उपयोगकर्ता की पहचान और अनुमतियाँ होती हैं।",
          "क्लाइंट auth_token और auth_user को localStorage में संग्रहीत कर संरक्षित रूट खोलता है।"
        ],
        memberLoginTitle: "सदस्य मोबाइल OTP लॉगिन प्रक्रिया",
        memberLoginSteps: [
          "सदस्य मोबाइल ऐप पर 10-अंकीय प्राथमिक फ़ोन नंबर दर्ज करता है।",
          "सिस्टम नंबर सत्यापित कर 60 सेकंड का कूलडाउन लागू करता है और सुरक्षित 6-अंकीय OTP बनाता है।",
          "SMS गेटवे से संदेश भेजता है और 10 मिनट की समाप्ति समयसीमा निर्धारित करता है।",
          "सफल सत्यापन पर OTP हटा दिया जाता है (रीप्ले अटैक सुरक्षा) और JWT सत्र अधिकृत होता है।"
        ]
      },
      dashboard: {
        title: "3. डैशबोर्ड एवं रियल-टाइम एनालिटिक्स",
        badge: "KPIs व मेट्रिक्स",
        image: "/documention/Screenshot 2026-08-25 142830.png",
        imageCaption: "लाइव डैशबोर्ड: मुख्य मेट्रिक्स, मासिक वृद्धि रुझान, व्यावसायिक श्रेणियां और लाइव गतिविधि फ़ीड।",
        features: [
          {
            title: "शीर्ष KPI मेट्रिक्स कार्ड्स",
            desc: "कुल सदस्य, पंजीकृत व्यवसाय, सामुदायिक पोस्ट और सक्रिय आयोजनों की संख्या पिछले माह की तुलनात्मक प्रतिशत वृद्धि के साथ।"
          },
          {
            title: "सदस्य वृद्धि रुझान चार्ट",
            desc: "चुने हुए समयावधि (1 माह, 3 माह, 6 माह, 1 वर्ष) के अनुसार परिवार निर्देशिका के विस्तार को दर्शाता सुगम एरिया चार्ट।"
          },
          {
            title: "व्यावसायिक श्रेणी वितरण",
            desc: "बीमा, तकनीकी, मनोरंजन और अन्य क्षेत्रों में सदस्य व्यवसायों का डोनट पाई चार्ट।"
          },
          {
            title: "हालिया गतिविधियां व रिकॉर्ड्स",
            desc: "नए जुड़े सदस्यों, आगामी कार्यक्रमों और प्रकाशित घोषणाओं के त्वरित ऑडिट रिकॉर्ड्स।"
          }
        ]
      },
      members: {
        title: "4. परिवार निर्देशिका एवं सदस्य प्रबंधन",
        badge: "कोर डायरेक्टरी",
        image: "/documention/member.png",
        imageCaption: "परिवार निर्देशिका: परिवार प्रमुख टैग, खोज, फ़िल्टर और संपादन नियंत्रणों के साथ संपूर्ण सूची।",
        modalImage: "/documention/Screenshot 2026-08-25 143152.png",
        modalCaption: "सदस्य जोड़ें फ़ॉर्म: व्यक्तिगत विवरण, पारिवारिक पदानुक्रम, भौगोलिक चयन और फ़ोटो अपलोड।",
        points: [
          "पदानुक्रमित संरचना: 'परिवार प्रमुख' (स्वयं) को आश्रितों (पत्नी/पति, पुत्र, पुत्री, माता-पिता) से जोड़ता है।",
          "क्रमबद्ध भौगोलिक चयन: देश ➔ राज्य ➔ शहर ➔ गांव का मास्टर ड्रॉपडाउन फ़िल्टरिंग।",
          "सक्रिय/निष्क्रिय स्विच: सदस्यों को तुरंत निलंबित या अनुमोदित करने की सुविधा।",
          "आपातकालीन डेटा: ब्लड ग्रुप, जन्मतिथि और वर्षगांठ की जानकारी।"
        ]
      },
      committee: {
        title: "5. समिति नेतृत्व एवं प्रशासन",
        badge: "प्रशासन",
        modalImage: "/documention/committeememberadd.png",
        modalCaption: "समिति सदस्य जोड़ें: फ़ोटो अपलोड (अधिकतम 1MB), संपर्क, पदनाम और भूमिका चयन।",
        points: [
          "कार्यकारी बोर्ड प्रबंधन: अध्यक्ष, उपाध्यक्ष, सचिव, कोषाध्यक्ष और कार्यकारी सदस्य।",
          "समर्पित लॉगिन क्रेडेंशियल्स: भूमिका-प्राप्त समिति सदस्यों को डैशबोर्ड पहुंच क्रेडेंशियल मिलते हैं।",
          "मानकीकृत फ़ोटो अपलोड: 300x300 पिक्सल और 1MB सुरक्षा सीमा लागू।"
        ]
      },
      roles: {
        title: "6. भूमिकाएं एवं विस्तृत अनुमति मैट्रिक्स",
        badge: "अभिगम नियंत्रण",
        image: "/documention/role.png",
        imageCaption: "भूमिका प्रबंधन: सक्रिय स्थिति टॉगल के साथ विशेषाधिकार पैकेजों की सूची।",
        modalImage: "/documention/roleform.png",
        modalCaption: "भूमिका अनुमति संपादक: प्रत्येक मॉड्यूल के लिए सूची, जोड़ें, संपादित करें, हटाएं चेकबॉक्स ग्रिड।",
        points: [
          "मॉड्यूल-वार एक्शन ग्रिड: 18 कार्यात्मक मॉड्यूल्स जिनमें से प्रत्येक के लिए [List, Add, Edit, Delete] टॉगल हैं।",
          "सुपर एडमिन पूर्ण पहुंच: अध्यक्ष और सुपर एडमिन भूमिकाओं को स्वतः संपूर्ण सिस्टम पहुंच मिलती है।",
          "त्वरित निरस्तीकरण: किसी भूमिका को अक्षम करते ही सभी संबंधित एपीआई अनुरोध तुरंत ब्लॉक हो जाते हैं।"
        ]
      },
      activities: {
        title: "7. गतिविधियां मॉड्यूल (4-इन-1 एकीकृत टैब)",
        badge: "गतिविधियां टैब",
        image: "/documention/activitytab.png",
        imageCaption: "गतिविधियां हब: गैलरी, जन्मदिन, नौकरियां और इवेंट्स एक ही स्क्रीन पर।",
        tabs: [
          { name: "गैलरी", desc: "त्योहारों, सम्मेलनों और ऐतिहासिक आयोजनों की तस्वीरें बहु-छवि समर्थन के साथ प्रबंधित करें।" },
          { name: "जन्मदिन", desc: "आगामी सदस्य जन्मदिनों का स्वचालित कैलेंडर और बधाई ट्रैकिंग।" },
          { name: "नौकरियां (Job Vacancy)", desc: "समाज के सदस्यों हेतु नौकरी रिक्तियों, योग्यताओं और आवेदन की सुविधा।" },
          { name: "इवेंट्स (Events)", desc: "सांस्कृतिक कार्यक्रमों, उपस्थिति पंजीकरण (RSVP), निःशुल्क/सशुल्क टिकट और स्थल की जानकारी।" }
        ]
      },
      services: {
        title: "8. सेवाएं मॉड्यूल (3-इन-1 एकीकृत टैब)",
        badge: "सेवाएं टैब",
        image: "/documention/servicestab.png",
        imageCaption: "सेवाएं हब: व्यवसाय, छात्र और वैवाहिक निर्देशिका एक एकीकृत इंटरफ़ेस में।",
        tabs: [
          { name: "व्यवसाय (Businesses)", desc: "सदस्यों के व्यवसायों की निर्देशिका, संपर्क, वेबसाइट लिंक और श्रेणी वर्गीकरण।" },
          { name: "विद्यार्थी (Students)", desc: "छात्रों की शैक्षणिक उपलब्धियां, कक्षा, प्रतिशत और प्रोत्साहन पुरस्कार रिकॉर्ड।" },
          { name: "वैवाहिक (Matrimonies)", desc: "सत्यापित वैवाहिक बायोडाटा, शिक्षा, व्यवसाय और पारिवारिक पृष्ठभूमि का सुरक्षित रिकॉर्ड।" }
        ]
      },
      media: {
        title: "9. मीडिया एवं सामग्री मॉडरेशन (3-इन-1 टैब)",
        badge: "मीडिया हब",
        image: "/documention/mediatab.png",
        imageCaption: "मीडिया हब: सामुदायिक पोस्ट्स, समाचार विज्ञप्तियां और सदस्य फीडबैक।",
        tabs: [
          { name: "पोस्ट्स (Posts)", desc: "सामुदायिक विचार मंच, घोषणाएं और इंटरैक्टिव अपडेट्स।" },
          { name: "समाचार (News)", desc: "समाज के आधिकारिक परिपत्र, समाचार और कार्यकारिणी की घोषणाएं।" },
          { name: "फ़ीडबैक (Feedback)", desc: "सदस्यों की शिकायतों, सुझावों और पूछताछ का सीधा इनबॉक्स।" }
        ]
      },
      engagements: {
        title: "10. वित्त एवं जुड़ाव रिकॉर्ड्स (2-इन-1 टैब)",
        badge: "वित्तीय रिकॉर्ड",
        image: "/documention/engagementtab.png",
        imageCaption: "जुड़ाव हब: खर्च वाउचर और दान बहीखाता सीएसवी निर्यात सुविधा के साथ।",
        tabs: [
          { name: "खर्चे (Expenses)", desc: "सामुदायिक व्यय श्रेणियों (बिजली बिल, कार्यालय आपूर्ति, इवेंट आदि) का ऑडिटेड हिसाब।" },
          { name: "दान (Donations)", desc: "दानदाताओं की सूची, उद्देश्य आवंटन, रसीद रिकॉर्ड और सार्वजनिक सम्मान सूची।" }
        ]
      },
      masters: {
        title: "11. मास्टर डेटा कॉन्फ़िगरेशन",
        badge: "मास्टर हब",
        image: "/documention/mastertab.png",
        imageCaption: "मास्टर हब: देश, राज्य, शहर, गांव, ब्लड ग्रुप और विभिन्न श्रेणियों की केंद्रीय टेबल।",
        points: [
          "हॉरिजॉन्टल स्क्रॉल टैब: 10 मास्टर श्रेणियों (व्यवसाय, बैंक, देश, राज्य, शहर, गांव, ब्लड ग्रुप, इवेंट श्रेणी, गैलरी श्रेणी, व्यय श्रेणी) में आसान नेविगेशन।",
          "डायनेमिक फ़ॉर्म सिंक: यहां जोड़ा गया कोई भी डेटा तुरंत पूरे पोर्टल के सभी ड्रॉपडाउन में उपलब्ध हो जाता है।",
          "सक्रिय/निष्क्रिय स्थिति: रिकॉर्ड हटाए बिना विकल्पों को सक्षम या अक्षम करें।"
        ]
      },
      settings: {
        title: "12. थीम एवं ब्रांड अनुकूलन (Settings)",
        badge: "थीम कस्टमाइज़र",
        points: [
          "लाइव कलर पिकर: प्राथमिक, होवर, बॉर्डर और ग्लो रंगों के लिए डायनेमिक सीएसएस वेरिएबल्स।",
          "पब्लिक वेबसाइट ब्रांडिंग: लोगो, फ़ेविकॉन, फ़ोन, ईमेल और सोशल मीडिया लिंक्स (Facebook, WhatsApp, Instagram, YouTube) का नियंत्रण।",
          "डार्क / लाइट मोड: लोकल स्टोरेज में सुरक्षित रहने वाला स्मार्ट थीम स्विचिंग।"
        ]
      }
    }
  },

  gu: {
    header: {
      title: "પરિવાર સિસ્ટમ સંપૂર્ણ દસ્તાવેજીકરણ (Documentation)",
      subtitle: "સિસ્ટમ આર્કિટેક્ચર, હોદ્દા આધારિત કાર્યપ્રવાહ, વહીવટી નિયંત્રણો અને તમામ મોડ્યુલ્સની સંપૂર્ણ માર્ગદર્શિકા.",
      languageLabel: "ભાષા પસંદ કરો",
      versionBadge: "આવૃત્તિ ૨.૦ • લાઈવ",
      searchPlaceholder: "દસ્તાવેજો, કોષ્ટકો, સુવિધાઓ શોધો...",
      printBtn: "પ્રિન્ટ / PDF સાચવો"
    },
    nav: {
      overview: "પરિચય (Introduction)",
      auth: "પ્રમાણીકરણ અને સુરક્ષા",
      dashboard: "એનાલિટિક્સ અને ડેશબોર્ડ",
      members: "પરિવાર ડિરેક્ટરી (સભ્યો)",
      committee: "કારોબારી સમિતિ",
      roles: "હોદ્દા અને પરવાનગીઓ",
      activities: "પ્રવૃત્તિઓ (૪-ઇન-૧)",
      services: "સેવાઓ (૩-ઇન-૧)",
      media: "મીડિયા અને સમાચાર",
      engagements: "નાણાકીય હિસાબ અને દાન",
      masters: "માસ્ટર ડેટા સેટિંગ્સ",
      settings: "થીમ અને કસ્ટમાઇઝેશન"
    },
    sections: {
      overview: {
        welcomeTitle: "પરિવાર પોર્ટલમાં આપનું સ્વાગત છે!",
        welcomeSubtitle: "સંપૂર્ણ સમાજ અને પારિવારિક સંગઠન વ્યવસ્થાપન સિસ્ટમ.",
        whyTitle: "પરિવાર પ્લેટફોર્મ શા માટે?",
        whyPoints: [
          { title: "કેન્દ્રીકૃત વંશવેલો અને સભ્ય ડિરેક્ટરી", desc: "પરિવારના મોભી, પારિવારિક સંબંધો, બ્લડ ગ્રૂપ ઇન્ડેક્સ અને સભ્ય પ્રોફાઇલનું સંપૂર્ણ સંચાલન." },
          { title: "કારોબારી સમિતિ નેતૃત્વ અને શાસન", desc: "પ્રમુખ, મંત્રી અને વિભાગીય વડાઓને હોદ્દા આધારિત ચોક્કસ પરવાનગીઓનું વિતરણ." },
          { title: "સામાજિક પ્રવૃત્તિઓ અને સમાચાર", desc: "વાર્ષિક સ્નેહમિલન, બેઠકો, પરિપત્રો અને સમાજની સિદ્ધિઓની ત્વરિત જાહેરાત." },
          { title: "વ્યાવસાયિક અને વૈવાહિક સેવાઓ", desc: "ચકાસાયેલ બિઝનેસ ડિરેક્ટરી અને ગોપનીય વૈવાહિક બાયોડેટાનું આદાનપ્રદાન." },
          { title: "પારદર્શક નાણાકીય હિસાબો (લેજર)", desc: "લાઈવ દાન નોંધણી અને સમિતિ મુજબ પ્રમાણિત ખર્ચ વાઉચરનો ચોખ્ખો હિસાબ." },
          { title: "ત્રિ-ભાષી અને ત્વરિત નોટિફિકેશન", desc: "ગુજરાતી, હિન્દી અને અંગ્રેજી ભાષામાં રીયલ-ટાઇમ એલર્ટ્સ અને સરળ ઉપયોગ." }
        ],
        supportTitle: "સંપર્ક અને સહાય",
        website: "https://parivar.me",
        email: "support@parivar.org",
        phone: "+91 88667 79008",
        setupProgressTitle: "ઝડપી શરૂઆત માર્ગદર્શિકા",
        setupSteps: [
          {
            stepNum: "01",
            title: "માસ્ટર ડેટા ગોઠવો",
            desc: "પરિવારોની નોંધણી પહેલાં દેશ, રાજ્ય, શહેર, ગામ અને વ્યવસાય શ્રેણીઓ સેટ કરો.",
            tag: "૧૦-ઇન-૧ માસ્ટર્સ",
            time: "પગલું ૧"
          },
          {
            stepNum: "02",
            title: "હોદ્દા અને પરવાનગીઓ નક્કી કરો",
            desc: "સમિતિ સભ્યો, સબ-એડમિન અને વિભાગીય વડાઓ માટે વિગતવાર પરવાનગીઓ આપો.",
            tag: "સુરક્ષા વ્યવસ્થા",
            time: "પગલું ૨"
          },
          {
            stepNum: "03",
            title: "પરિવાર અને સભ્યો ઉમેરો",
            desc: "પરિવારના મોભી, પારિવારિક સંબંધો, બ્લડ ગ્રૂપ અને ફોટા સાથે ડિરેક્ટરી બનાવો.",
            tag: "સભ્ય ડિરેક્ટરી",
            time: "પગલું ૩"
          },
          {
            stepNum: "04",
            title: "કારોબારી સમિતિ નિયુક્ત કરો",
            desc: "પ્રમુખ, મંત્રી, ખજાનચી અને યુવા પાંખના હોદ્દેદારોને જવાબદારીઓ સોંપો.",
            tag: "કારોબારી શાસન",
            time: "પગલું ૪"
          },
          {
            stepNum: "05",
            title: "પ્રવૃત્તિઓ અને સેવાઓ શરૂ કરો",
            desc: "સ્નેહમિલન કાર્યક્રમો, સિદ્ધિઓ, બિઝનેસ ડિરેક્ટરી અને વૈવાહિક બાયોડેટા પ્રસિદ્ધ કરો.",
            tag: "૭-ઇન-૧ સેવાઓ",
            time: "પગલું ૫"
          },
          {
            stepNum: "06",
            title: "નાણાકીય હિસાબ અને સેટિંગ્સ",
            desc: "દાન પાવતીઓ, ખર્ચ વાઉચર નોંધણી અને પોર્ટલની થીમ/રંગો કસ્ટમાઇઝ કરો.",
            tag: "હિસાબ અને થીમ",
            time: "પગલું ૬"
          }
        ]
      },
      dashboard: {
        title: "૨. ડેશબોર્ડ અને રીયલ-ટાઇમ એનાલિટિક્સ",
        badge: "અવલોકન અને એનાલિટિક્સ",
        image: "/documention/Screenshot 2026-08-25 142830.png",
        imageCaption: "લાઇવ ડેશબોર્ડ: મુખ્ય આંકડાકીય વિગતો, માસિક વૃદ્ધિ વલણ, વ્યાપારી વર્ગો અને લાઇવ પ્રવૃત્તિ ફીડ.",
        features: [
          {
            title: "કુલ સભ્યો અને કુટુંબ સંખ્યા",
            desc: "કુલ નોંધાયેલ સમાજ સભ્યો, સક્રિય પરિવારો અને નવી નોંધણીઓની લાઇવ સંખ્યા."
          },
          {
            title: "નોંધાયેલ વ્યવસાયો અને ડિરેક્ટરી",
            desc: "સભ્યો દ્વારા સંચાલિત વ્યવસાયો અને સેવા પ્રદાતાઓની યાદીનું તારણ."
          },
          {
            title: "સામાજિક પોસ્ટ્સ અને કાર્યક્રમો",
            desc: "આગામી સ્નેહમિલન, બેઠકો અને પ્રકાશિત સામાજિક પરિપત્રોનું ત્વરિત વિવરણ."
          },
          {
            title: "માસિક પ્રગતિ ચાર્ટ અને વલણ",
            desc: "માસવાર સભ્ય વધારો અને વ્યાવસાયિક કેટેગરીઓનો ગ્રાફિકલ ચાર્ટ."
          }
        ]
      },
      members: {
        title: "૪. પરિવાર ડિરેક્ટરી અને સભ્ય સંચાલન",
        badge: "મુખ્ય ડિરેક્ટરી",
        image: "/documention/member.png",
        imageCaption: "પરિવાર રજિસ્ટ્રી: કુટુંબ વડા ટેગ, શોધ, ફિલ્ટર અને ફેરફાર નિયંત્રણો સાથે સંપૂર્ણ યાદી.",
        modalImage: "/documention/Screenshot 2026-08-25 143152.png",
        modalCaption: "સભ્ય ઉમેરો ફોર્મ: વ્યક્તિગત વિગતો, પારિવારિક વંશવેલો, ભૌગોલિક પસંદગી અને ફોટો અપલોડ.",
        points: [
          "પારિવારિક માળખું: 'કુટુંબ વડા' (પોતે) સાથે આશ્રિતો (પત્ની/પતિ, પુત્ર, પુત્રી, માતા-પિતા) ને જોડે છે.",
          "ભૌગોલિક પસંદગી: દેશ ➔ રાજ્ય ➔ શહેર ➔ ગામનું માસ્ટર ડ્રોપડાઉન ફિલ્ટરિંગ.",
          "સક્રિય/નિષ્ક્રિય સ્વિચ: સભ્યોને તાત્કાલિક સ્થગિત અથવા મંજૂર કરવાની સુવિધા.",
          "તાકીદની વિગતો: બ્લડ ગ્રૂપ, જન્મતારીખ અને લગ્નતિથિની નોંધણી."
        ]
      },
      committee: {
        title: "૫. કારોબારી સમિતિ અને વહીવટ",
        badge: "વહીવટ",
        modalImage: "/documention/committeememberadd.png",
        modalCaption: "સમિતિ સભ્ય ઉમેરો: ફોટો અપલોડ (મહત્તમ 1MB), સંપર્ક, હોદ્દો અને રોલ પસંદગી.",
        points: [
          "કારોબારી બોર્ડ સંચાલન: પ્રમુખ, ઉપપ્રમુખ, મંત્રી, ખજાનચી અને કારોબારી સભ્યો.",
          "વિશેષ લોગિન ક્રેડેન્શિયલ્સ: રોલ ધરાવતા સમિતિ સભ્યોને ડેશબોર્ડ વપરાશ માટે લોગિન મળે છે.",
          "પ્રમાણિત ફોટો અપલોડ: 300x300 પિક્સેલ અને 1MB સુરક્ષા મર્યાદા લાગુ."
        ]
      },
      roles: {
        title: "૬. હોદ્દા અને વિગતવાર પરવાનગી મેટ્રિક્સ",
        badge: "અધિકાર નિયંત્રણ",
        image: "/documention/role.png",
        imageCaption: "રોલ મેનેજમેન્ટ: સક્રિય સ્થિતિ સાથે અધિકાર પેકેજોની યાદી.",
        modalImage: "/documention/roleform.png",
        modalCaption: "રોલ પરવાનગી એડિટર: દરેક મોડ્યુલ માટે જુઓ, ઉમેરો, સુધારો, કાઢી નાખો ચેકબોક્સ ગ્રીડ.",
        points: [
          "મોડ્યુલ મુજબ એક્શન ગ્રીડ: ૧૮ કાર્યકારી મોડ્યુલ્સ જેમાં દરેક માટે [List, Add, Edit, Delete] નિયંત્રણ છે.",
          "સુપર એડમિન પૂર્ણ અધિકાર: પ્રમુખ અને સુપર એડમિન હોદ્દાને આપમેળે સમગ્ર સિસ્ટમનો પૂર્ણ અધિકાર મળે છે.",
          "ત્વરિત રદ્દીકરણ: કોઈપણ રોલ નિષ્ક્રિય કરતાં જ સંબંધિત વપરાશકર્તાઓની તમામ API રિક્વેસ્ટ તાત્કાલિક બ્લોક થાય છે."
        ]
      },
      activities: {
        title: "૭. પ્રવૃત્તિઓ મોડ્યુલ (૪-ઇન-૧ એકીકૃત ટેબ)",
        badge: "પ્રવૃત્તિઓ ટેબ",
        image: "/documention/activitytab.png",
        imageCaption: "પ્રવૃત્તિઓ હબ: ગેલેરી, જન્મદિવસ, નોકરીઓ અને ઇવેન્ટ્સ એક જ સ્ક્રીન પર.",
        tabs: [
          { name: "ગેલેરી", desc: "ઉત્સવો, સંમેલનો અને ઐતિહાસિક કાર્યક્રમોના ફોટા મલ્ટી-ઇમેજ સપોર્ટ સાથે મેનેજ કરો." },
          { name: "જન્મદિવસ", desc: "આગામી સભ્ય જન્મદિવસોનું સ્વચાલિત કેલેન્ડર અને શુભેચ્છા ટ્રેકિંગ." },
          { name: "નોકરીઓ (Job Vacancies)", desc: "સમાજના સભ્યો માટે રોજગારની તકો, લાયકાતો અને સીધા સંપર્કની સુવિધા." },
          { name: "ઇવેન્ટ્સ (Events)", desc: "સાંસ્કૃતિક કાર્યક્રમો, હાજરી નોંધણી (RSVP), ફ્રી/પેઇડ ટિકિટ અને સ્થળની માહિતી." }
        ]
      },
      services: {
        title: "૮. સેવાઓ મોડ્યુલ (૩-ઇન-૧ એકીકૃત ટેબ)",
        badge: "સેવાઓ ટેબ",
        image: "/documention/servicestab.png",
        imageCaption: "સેવાઓ હબ: વ્યવસાય, વિદ્યાર્થીઓ અને લગ્ન ડિરેક્ટરી એક જ ઇન્ટરફેસમાં.",
        tabs: [
          { name: "વ્યવસાયો (Businesses)", desc: "સભ્યોના વ્યવસાયોની ડિરેક્ટરી, સંપર્ક, વેબસાઇટ લિંક અને કેટેગરી વર્ગીકરણ." },
          { name: "વિદ્યાર્થીઓ (Students)", desc: "વિદ્યાર્થીઓની શૈક્ષણિક સિદ્ધિઓ, ધોરણ, ટકાવારી અને પ્રોત્સાહક ઇનામોની નોંધ." },
          { name: "લગ્ન વિષયક (Matrimonies)", desc: "ચકાસાયેલ લગ્ન બાયોડેટા, શિક્ષણ, વ્યવસાય અને પારિવારિક પૃષ્ઠભૂમિની સુરક્ષિત નોંધણી." }
        ]
      },
      media: {
        title: "૯. મીડિયા અને કન્ટેન્ટ મોડરેશન (૩-ઇન-૧ ટેબ)",
        badge: "મીડિયા હબ",
        image: "/documention/mediatab.png",
        imageCaption: "મીડિયા હબ: સામાજિક પોસ્ટ્સ, સમાચાર પરિપત્રો અને સભ્ય પ્રતિભાવો.",
        tabs: [
          { name: "પોસ્ટ્સ (Posts)", desc: "સામાજિક વિચાર મંચ, જાહેરાતો અને ઇન્ટરેક્ટિવ અપડેટ્સ." },
          { name: "સમાચાર (News)", desc: "સમાજના સત્તાવાર પરિપત્રો, પ્રેસ નોટો અને કારોબારીની જાહેરાતો." },
          { name: "પ્રતિભાવ (Feedback)", desc: "સભ્યોના પ્રશ્નો, સૂચનો અને ફરિયાદોનું સીધું ઇનબોક્સ." }
        ]
      },
      engagements: {
        title: "૧૦. નાણાકીય હિસાબ અને દાન રેકોર્ડ્સ (૨-ઇન-૧ ટેબ)",
        badge: "નાણાકીય રેકોર્ડ્સ",
        image: "/documention/engagementtab.png",
        imageCaption: "એંગેજમેન્ટ હબ: ખર્ચ વાઉચર્સ અને દાન ખાતાવહી CSV ડાઉનલોડ સુવિધા સાથે.",
        tabs: [
          { name: "ખર્ચ (Expenses)", desc: "સામાજિક ખર્ચની કેટેગરીઓ (લાઈટ બિલ, ઓફિસ ખર્ચ, ઇવેન્ટ વગેરે) નો ઓડિટેડ હિસાબ." },
          { name: "દાન (Donations)", desc: "દાતાઓની યાદી, હેતુ ફાળવણી, રસીદ નોંધણી અને જાહેર સન્માન યાદી." }
        ]
      },
      masters: {
        title: "૧૧. માસ્ટર ડેટા કન્ફિગરેશન",
        badge: "માસ્ટર હબ",
        image: "/documention/mastertab.png",
        imageCaption: "માસ્ટર હબ: દેશ, રાજ્ય, શહેર, ગામ, બ્લડ ગ્રૂપ અને વિવિધ કેટેગરીનું કેન્દ્રીય સંચાલન.",
        points: [
          "આડી સ્ક્રોલિંગ ટેબ સિસ્ટમ: ૧૦ માસ્ટર કેટેગરીઝ (વ્યવસાય, બેંક, દેશ, રાજ્ય, શહેર, ગામ, બ્લડ ગ્રૂપ, ઇવેન્ટ વર્ગ, ગેલેરી વર્ગ, ખર્ચ વર્ગ) માં સરળ નેવિગેશન.",
          "ડાયનેમિક ફોર્મ સિન્ક: અહીં ઉમેરેલી કોઈપણ વિગત સમગ્ર પોર્ટલના તમામ ડ્રોપડાઉનમાં તાત્કાલિક ઉપલબ્ધ થાય છે.",
          "સક્રિય/નિષ્ક્રિય સ્થિતિ: જૂના રેકોર્ડ્સ ગુમાવ્યા વિના વિકલ્પોને ચાલુ કે બંધ કરવાની સુવિધા."
        ]
      },
      settings: {
        title: "૧૨. થીમ અને બ્રાન્ડ કસ્ટમાઇઝેશન (Settings)",
        badge: "થીમ કસ્ટમાઇઝર",
        points: [
          "લાઇવ કલર પીકર: પ્રાથમિક, હોવર, બોર્ડર અને ગ્લો રંગો માટે ડાયનેમિક વેરીએબલ્સ.",
          "જાહેર વેબસાઇટ બ્રાન્ડિંગ: લોગો, ફેવિકોન, ફોન, ઈમેઈલ અને સોશિયલ મીડિયા લિંક્સ (Facebook, WhatsApp, Instagram, YouTube) નું નિયંત્રણ.",
          "ડાર્ક / લાઇટ મોડ: લોકલ સ્ટોરેજમાં સચવાઈ રહેતું સ્માર્ટ થીમ સ્વિચિંગ."
        ]
      }
    }
  }
}
