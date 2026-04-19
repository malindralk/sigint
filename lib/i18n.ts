// MALINDRA PHASE 5
// lib/i18n.ts
// Build-time locale utilities for static i18n routing.
// Extended: Arabic (ar), Tamil (ta), Hindi (hi) with RTL support.
//
// NOTE: Next.js output: 'export' is INCOMPATIBLE with next.config i18n{} block.
// We use file-system routing: app/[locale]/... with generateStaticParams.
// Locales are compiled into static paths at build time — no runtime locale detection.

export const locales = ['en', 'si', 'ar', 'ta', 'hi'] as const;
export type Locale = (typeof locales)[number];

/** RTL locales — used for dir="rtl" and CSS logical properties */
export const RTL_LOCALES: ReadonlySet<Locale> = new Set<Locale>(['ar']);

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.has(locale);
}

export function localeDir(locale: Locale): 'rtl' | 'ltr' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

export const localeLang: Record<Locale, string> = {
  en: 'en',
  si: 'si',
  ar: 'ar',
  ta: 'ta',
  hi: 'hi',
};

export const defaultLocale: Locale = 'en';

export const localeNativeName: Record<Locale, string> = {
  en: 'English',
  si: 'සිංහල',
  ar: 'العربية',
  ta: 'தமிழ்',
  hi: 'हिन्दी',
};

// ── UI string translations ────────────────────────────────────────────────────

export const ui = {
  en: {
    siteTitle: 'Malindra',
    tagline: 'Intelligence for the Laccadive Sea Age',
    taglineBody:
      'Sovereign strategy analysis grounded in Sri Lankan reality. Data-driven, calm in register, precise in implication. SIGINT structure: Signal → Context → Implication → Action.',
    featuredLabel: 'Featured Analysis',
    recentLabel: 'Recent Analysis',
    viewAll: 'View all →',
    archiveTitle: 'Archive',
    archiveAll: 'All',
    filterByTopic: 'Filter by Topic',
    relatedIntelligence: 'Related Intelligence',
    subscribeCta: 'Subscribe',
    subscribeLabel: 'Intelligence Dispatch',
    subscribeHeading: 'Stay Grounded in the Signal',
    subscribeBody: 'Receive Malindra analysis when it matters. No noise. Sovereign frequency.',
    subscribeSuccess: "You're subscribed. The signal will reach you.",
    subscribeError: 'Subscription failed. Please try again.',
    networkError: 'Network error. Please try again.',
    emailLabel: 'Email Address',
    emailPlaceholder: 'your@email.com',
    subscribing: 'Subscribing…',
    topicsLabel: 'Topics of Interest',
    privacyNote: 'No spam. Unsubscribe anytime. Data handled per our privacy policy.',
    heritageTag: 'Malindra · මලින්ද්‍ර',
    minRead: 'min read',
    allAnalysis: '← All Analysis',
    browseArchive: 'Browse Archive →',
    sigintLabel: 'SIGINT ANALYSIS',
    noArticles: 'No articles found for this tag.',
    skipToContent: 'Skip to main content',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    nav: {
      analysis: 'Analysis',
      archive: 'Archive',
      reference: 'Reference',
      learningPath: 'Learning Path',
      courseraPath: 'Coursera Path',
      emSideChannel: 'EM Side-Channel',
      sigint: 'SIGINT',
      data: 'Data',
      knowledgeGraph: 'Knowledge Graph',
      marketIntel: 'Market Intel',
      companies: 'Companies',
      equipment: 'Equipment',
      research: 'Research',
      dashboard: 'Dashboard',
      overview: 'Overview',
      articles: 'Articles',
      users: 'Users',
      settings: 'Settings',
      account: 'Account',
      signIn: 'Sign in',
      signOut: 'Sign out',
      privacy: 'Privacy',
      terms: 'Terms',
      contact: 'Contact',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      language: 'Language',
    },
    topics: {
      debt: 'Debt Restructuring',
      digital: 'Digital Policy',
      tourism: 'Tourism',
      geopolitics: 'Geopolitics',
      energy: 'Renewable Energy',
    },
  },
  si: {
    siteTitle: 'මලින්ද්‍ර',
    tagline: 'ඉන්දියන් සාගර යුගය සඳහා බුද්ධිය',
    taglineBody:
      'ශ්‍රී ලාංකික යථාර්ථය මත පදනම් වූ ස්වෛරීී ක්‍රමෝපාය විශ්ලේෂණය. දත්ත-ධාවිත, සන්සුන් ශෛලිය, නිශ්චිත ඇඟවීම. SIGINT ව්‍යූහය: සංඥාව → සන්දර්භය → ඇඟවීම → ක්‍රියාව.',
    featuredLabel: 'විශේෂ විශ්ලේෂණය',
    recentLabel: 'මෑත විශ්ලේෂණ',
    viewAll: 'සියල්ල බලන්න →',
    archiveTitle: 'සංරක්ෂිතය',
    archiveAll: 'සියල්ල',
    filterByTopic: 'මාතෘකාව අනුව පෙරහන් කරන්න',
    relatedIntelligence: 'අදාළ බුද්ධිය',
    subscribeCta: 'දායක වන්න',
    subscribeLabel: 'බුද්ධිය ලිපිය',
    subscribeHeading: 'සංඥාව සමඟ සම්බන්ධ වන්න',
    subscribeBody: 'වැදගත් වූ විට Malindra විශ්ලේෂණය ලබා ගන්න. ශබ්දය නැත. ස්වෛරී සංඛ්‍යාතය.',
    subscribeSuccess: 'ඔබ දායක විය. සංඥාව ඔබ වෙත ළඟා වෙනු ඇත.',
    subscribeError: 'දායකත්වය අසාර්ථක විය. නැවත උත්සාහ කරන්න.',
    networkError: 'ජාල දෝෂයකි. නැවත උත්සාහ කරන්න.',
    emailLabel: 'විද්‍යුත් තැපෑල',
    emailPlaceholder: 'ඔබේ@email.com',
    subscribing: 'දායකත්වය ලබා ගනිමින්...',
    topicsLabel: 'ඔබේ රුචිතා මාතෘකා',
    privacyNote: 'ස්පෑම් නැත. ඕනෑ විටෙක ඉවත් වන්න. දත්ත රහස්‍යතා ප්‍රතිපත්තිය අනුව.',
    heritageTag: 'මලින්ද්‍ර · කෝට්ටේ රාජධානිය 1412–1467',
    minRead: 'මිනිත්තු',
    allAnalysis: '← සියළු විශ්ලේෂණ',
    browseArchive: 'සංරක්ෂිතය →',
    sigintLabel: 'SIGINT විශ්ලේෂණය',
    noArticles: 'මෙම ටැගය සඳහා ලිපි හමු නොවීය.',
    skipToContent: 'ප්‍රධාන අන්තර්ගතයට යන්න',
    openMenu: 'සංචාලන මෙනුව විවෘත කරන්න',
    closeMenu: 'සංචාලන මෙනුව වසන්න',
    nav: {
      analysis: 'විශ්ලේෂණය',
      archive: 'සංරක්ෂිතය',
      reference: 'යොමුව',
      learningPath: 'ඉගෙනීමේ මාර්ගය',
      courseraPath: 'Coursera මාර්ගය',
      emSideChannel: 'විද්‍යුත් චුම්බක පාර්ශ්ව',
      sigint: 'සංඥා බුද්ධි (SIGINT)',
      data: 'දත්ත',
      knowledgeGraph: 'දැනුම් ප්‍රස්තාරය',
      marketIntel: 'වෙළඳපොළ බුද්ධිය',
      companies: 'සමාගම්',
      equipment: 'උපකරණ',
      research: 'පර්යේෂණ',
      dashboard: 'උපකරණ පුවරුව',
      overview: 'දළ විసඳුම',
      articles: 'ලිපි',
      users: 'පරිශීලකයින්',
      settings: 'සැකසුම්',
      account: 'ගිණුම',
      signIn: 'පිවිසෙන්න',
      signOut: 'වරන්න',
      privacy: 'පෞද්ගලිකත්වය',
      terms: 'නියම සහ කොන්දේසි',
      contact: 'සම්බන්ධ වන්න',
      lightMode: 'දීප්ත ආකාරය',
      darkMode: 'අඳුරු ආකාරය',
      language: 'භාෂාව',
    },
    topics: {
      debt: 'ණය ප්‍රතිව්‍යුහගත කිරීම',
      digital: 'ඩිජිටල් ප්‍රතිපත්ති',
      tourism: 'සංචාරක',
      geopolitics: 'භූ-දේශපාලන',
      energy: 'බලශක්ති',
    },
  },
  ar: {
    siteTitle: 'مالیندرا',
    tagline: 'الاستخبارات لعصر المحيط الهندي',
    taglineBody:
      'تحليل استراتيجي سيادي مبني على الواقع السريلانكي. مدفوع بالبيانات، هادئ في الأسلوب، دقيق في الاستنتاج. هيكل SIGINT: الإشارة → السياق → الاستنتاج → الإجراء.',
    featuredLabel: 'التحليل المميز',
    recentLabel: 'التحليلات الأخيرة',
    viewAll: 'عرض الكل ←',
    archiveTitle: 'الأرشيف',
    archiveAll: 'الكل',
    filterByTopic: 'تصفية حسب الموضوع',
    relatedIntelligence: 'الاستخبارات ذات الصلة',
    subscribeCta: 'اشترك',
    subscribeLabel: 'نشرة الاستخبارات',
    subscribeHeading: 'ابقَ على اتصال بالإشارة',
    subscribeBody: 'تلقَّ تحليل مالیندرا عندما يهم. لا ضجيج. تردد سيادي.',
    subscribeSuccess: 'لقد اشتركت. ستصلك الإشارة.',
    subscribeError: 'فشل الاشتراك. حاول مرة أخرى.',
    networkError: 'خطأ في الشبكة. حاول مرة أخرى.',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'بريدك@example.com',
    subscribing: 'جارٍ الاشتراك…',
    topicsLabel: 'المواضيع التي تهمك',
    privacyNote: 'لا رسائل مزعجة. إلغاء الاشتراك في أي وقت. البيانات وفق سياسة الخصوصية.',
    heritageTag: 'مالیندرا · مملكة كوتي 1412–1467 م',
    minRead: 'دقيقة قراءة',
    allAnalysis: '→ كل التحليلات',
    browseArchive: '← تصفح الأرشيف',
    sigintLabel: 'تحليل SIGINT',
    noArticles: 'لم يتم العثور على مقالات لهذا الموضوع.',
    skipToContent: 'تخطى إلى المحتوى الرئيسي',
    openMenu: 'افتح قائمة التنقل',
    closeMenu: 'أغلق قائمة التنقل',
    nav: {
      analysis: 'التحليل',
      archive: 'الأرشيف',
      reference: 'المرجع',
      learningPath: 'مسار التعلم',
      courseraPath: 'مسار Coursera',
      emSideChannel: 'القناة الجانبية الكهرومغناطيسية',
      sigint: 'استخبارات الإشارات (SIGINT)',
      data: 'البيانات',
      knowledgeGraph: 'رسم المعرفة',
      marketIntel: 'استخبارات السوق',
      companies: 'الشركات',
      equipment: 'المعدات',
      research: 'البحث',
      dashboard: 'لوحة التحكم',
      overview: 'نظرة عامة',
      articles: 'المقالات',
      users: 'المستخدمون',
      settings: 'الإعدادات',
      account: 'الحساب',
      signIn: 'تسجيل الدخول',
      signOut: 'تسجيل الخروج',
      privacy: 'الخصوصية',
      terms: 'الشروط',
      contact: 'اتصل بنا',
      lightMode: 'الوضع الفاتح',
      darkMode: 'الوضع الداكن',
      language: 'اللغة',
    },
    topics: {
      debt: 'إعادة هيكلة الديون',
      digital: 'السياسة الرقمية',
      tourism: 'السياحة',
      geopolitics: 'الجيوسياسة',
      energy: 'الطاقة المتجددة',
    },
  },
  ta: {
    siteTitle: 'மலிந்திர',
    tagline: 'இந்து மகாசமுத்திர யுகத்திற்கான நுண்ணறிவு',
    taglineBody:
      'இலங்கை யதார்த்தத்தில் வேரூன்றிய இறையாண்மை மூலோபாய பகுப்பாய்வு. தரவு சார்ந்த, அமைதியான பதிவேட்டில், தெளிவான உட்குறிப்புடன். SIGINT அமைப்பு: சமிக்ஞை → சூழல் → உட்குறிப்பு → நடவடிக்கை.',
    featuredLabel: 'சிறப்பு பகுப்பாய்வு',
    recentLabel: 'சமீபத்திய பகுப்பாய்வுகள்',
    viewAll: 'அனைத்தும் பார்க்க →',
    archiveTitle: 'காப்பகம்',
    archiveAll: 'அனைத்தும்',
    filterByTopic: 'தலைப்பின்படி வடிகட்டு',
    relatedIntelligence: 'தொடர்புடைய நுண்ணறிவு',
    subscribeCta: 'சந்தா செய்யுங்கள்',
    subscribeLabel: 'நுண்ணறிவு அனுப்புதல்',
    subscribeHeading: 'சமிக்ஞையுடன் தொடர்பில் இருங்கள்',
    subscribeBody: 'முக்கியமான நேரத்தில் மலிந்திர பகுப்பாய்வைப் பெறுங்கள். சத்தமில்லை. இறையாண்மை அதிர்வெண்.',
    subscribeSuccess: 'சந்தா செய்தீர்கள். சமிக்ஞை உங்களை அடையும்.',
    subscribeError: 'சந்தா தோல்வி. மீண்டும் முயற்சிக்கவும்.',
    networkError: 'நெட்வொர்க் பிழை. மீண்டும் முயற்சிக்கவும்.',
    emailLabel: 'மின்னஞ்சல் முகவரி',
    emailPlaceholder: 'உங்கள்@email.com',
    subscribing: 'சந்தா செய்கிறது…',
    topicsLabel: 'ஆர்வமுள்ள தலைப்புகள்',
    privacyNote: 'ஸ்பேம் இல்லை. எப்போது வேண்டுமானாலும் நீக்கலாம். தரவு தனியுரிமை கொள்கையின்படி.',
    heritageTag: 'மலிந்திர · கோட்டே இராச்சியம் 1412–1467 கி.பி',
    minRead: 'நிமிட வாசிப்பு',
    allAnalysis: '← அனைத்து பகுப்பாய்வுகள்',
    browseArchive: 'காப்பகம் →',
    sigintLabel: 'SIGINT பகுப்பாய்வு',
    noArticles: 'இந்த குறிச்சொல்லுக்கு கட்டுரைகள் இல்லை.',
    skipToContent: 'முதன்மை உள்ளடக்கத்திற்கு செல்லவும்',
    openMenu: 'வழிசெலுத்தல் மெனுவை திறக்கவும்',
    closeMenu: 'வழிசெலுத்தல் மெனுவை மூடவும்',
    topics: {
      debt: 'கடன் மறுகட்டமைப்பு',
      digital: 'டிஜிட்டல் கொள்கை',
      tourism: 'சுற்றுலா',
      geopolitics: 'புவிசார் அரசியல்',
      energy: 'புதுப்பிக்கத்தக்க ஆற்றல்',
    },
  },
  hi: {
    siteTitle: 'मलिंद्र',
    tagline: 'हिंद महासागर युग के लिए खुफिया जानकारी',
    taglineBody:
      'श्रीलंकाई वास्तविकता पर आधारित संप्रभु रणनीतिक विश्लेषण। डेटा-संचालित, शांत स्वर में, निहितार्थ में सटीक। SIGINT संरचना: संकेत → संदर्भ → निहितार्थ → कार्रवाई।',
    featuredLabel: 'विशेष विश्लेषण',
    recentLabel: 'हाल का विश्लेषण',
    viewAll: 'सभी देखें →',
    archiveTitle: 'संग्रह',
    archiveAll: 'सभी',
    filterByTopic: 'विषय के अनुसार फ़िल्टर करें',
    relatedIntelligence: 'संबंधित खुफिया जानकारी',
    subscribeCta: 'सदस्यता लें',
    subscribeLabel: 'खुफिया डिस्पैच',
    subscribeHeading: 'संकेत से जुड़े रहें',
    subscribeBody: 'जब मायने रखे तब मलिंद्र विश्लेषण प्राप्त करें। कोई शोर नहीं। संप्रभु आवृत्ति।',
    subscribeSuccess: 'आपने सदस्यता ली। संकेत आप तक पहुंचेगा।',
    subscribeError: 'सदस्यता विफल। कृपया पुनः प्रयास करें।',
    networkError: 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।',
    emailLabel: 'ईमेल पता',
    emailPlaceholder: 'आपका@email.com',
    subscribing: 'सदस्यता ली जा रही है…',
    topicsLabel: 'रुचि के विषय',
    privacyNote: 'कोई स्पैम नहीं। कभी भी सदस्यता रद्द करें। डेटा गोपनीयता नीति के अनुसार।',
    heritageTag: 'मलिंद्र · कोट्टे राज्य 1412–1467 ई.',
    minRead: 'मिनट पढ़ना',
    allAnalysis: '← सभी विश्लेषण',
    browseArchive: 'संग्रह देखें →',
    sigintLabel: 'SIGINT विश्लेषण',
    noArticles: 'इस टैग के लिए कोई लेख नहीं मिला।',
    skipToContent: 'मुख्य सामग्री पर जाएं',
    openMenu: 'नेविगेशन मेनू खोलें',
    closeMenu: 'नेविगेशन मेनू बंद करें',
    topics: {
      debt: 'ऋण पुनर्गठन',
      digital: 'डिजिटल नीति',
      tourism: 'पर्यटन',
      geopolitics: 'भू-राजनीति',
      energy: 'नवीकरणीय ऊर्जा',
    },
  },
} satisfies Record<Locale, Record<string, unknown>>;

export type UI = typeof ui.en;

export function getUI(locale: Locale): UI {
  return (ui[locale] ?? ui.en) as UI;
}

/**
 * Return the canonical path for a slug in the given locale.
 * e.g. /en/blog/my-slug  or  /si/blog/my-slug
 */
export function localePath(locale: Locale, ...segments: string[]): string {
  return `/${locale}/${segments.join('/')}`;
}

/**
 * Swap locale prefix in a path.
 * /en/blog/slug → /si/blog/slug
 */
export function swapLocale(pathname: string, currentLocale: Locale): string {
  const next: Locale = currentLocale === 'en' ? 'si' : 'en';
  if (pathname.startsWith(`/${currentLocale}/`)) {
    return `/${next}/${pathname.slice(currentLocale.length + 2)}`;
  }
  if (pathname === `/${currentLocale}`) {
    return `/${next}`;
  }
  return `/${next}${pathname}`;
}

/**
 * Detect the locale prefix in a pathname.
 * Returns defaultLocale if no prefix found.
 */
export function detectLocale(pathname: string): Locale {
  for (const locale of locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return defaultLocale;
}
