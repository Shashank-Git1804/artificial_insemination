import { createContext, useContext, useState, useCallback } from 'react';

const LanguageContext = createContext(null);

// Static translations for all UI text
// Sarvam AI is used for dynamic content (AI results, recommendations)
export const TRANSLATIONS = {
  en: {
    // Nav
    dashboard: 'Dashboard', myAnimals: 'My Animals', heatDetection: 'Heat Detection',
    healthCheck: 'Health Check', appointments: 'Appointments', logout: 'Logout',
    milkTracker: 'Milk Tracker', vaccination: 'Vaccination', history: 'History',
    // Dashboard
    welcome: 'Welcome', totalAnimals: 'Total Animals', heatDetections: 'Heat Detections',
    infectionAlerts: 'Infection Alerts', pendingAppointments: 'Pending Appointments',
    animalsBySpecies: 'Animals by Species', recentPredictions: 'Recent AI Predictions',
    govtCirculars: 'Government Circulars & Advisories',
    // Heat Detection
    heatDetectionTitle: 'Heat Detection', selectAnimal: 'Select Animal',
    selectFemaleAnimal: '-- Select female animal --',
    activitySpike: 'Activity Spike', activityHint: 'Is the animal moving more than usual?',
    restlessness: 'Restlessness', restlessnessHint: 'Is the animal restless, not eating?',
    mountingEvents: 'Mounting Behaviour', mountingHint: 'Is the animal trying to mount others or standing to be mounted?',
    visionScore: 'Visual Signs', visionHint: 'Upload photo for AI to check visual signs',
    runAnalysis: 'Run AI Analysis', analyzing: 'Analyzing...',
    photoLabel: 'Animal Photo (rear/side view)',
    // Results
    heatDetected: 'Heat Detected!', noHeat: 'No Heat Detected',
    confidence: 'Confidence', bookNow: 'Book AI Service Now',
    nextHeat: 'Next Expected Heat', watchFor: 'Watch For These Signs',
    bestWindow: 'Best Time for AI', callCentre: 'Call AI Centre',
    // Common
    low: 'Low', high: 'High', none: 'None', severe: 'Severe',
    save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete',
    register: 'Register', loading: 'Loading...',
    // Milk
    milkTrackerTitle: 'Milk Yield Tracker', addRecord: 'Add Record',
    morning: 'Morning', evening: 'Evening', totalLitres: 'Total Litres',
    // Vaccination
    vaccinationTitle: 'Vaccination Records', addVaccination: 'Add Vaccination',
    vaccineName: 'Vaccine Name', dueDate: 'Due Date', given: 'Given', due: 'Due',
  },
  kn: {
    // Nav
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', myAnimals: 'ನನ್ನ ಪ್ರಾಣಿಗಳು', heatDetection: 'ಗರ್ಭಧಾರಣೆ ಸಮಯ',
    healthCheck: 'ಆರೋಗ್ಯ ತಪಾಸಣೆ', appointments: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್', logout: 'ಲಾಗ್ ಔಟ್',
    milkTracker: 'ಹಾಲು ದಾಖಲೆ', vaccination: 'ಲಸಿಕೆ', history: 'ಇತಿಹಾಸ',
    // Dashboard
    welcome: 'ನಮಸ್ಕಾರ', totalAnimals: 'ಒಟ್ಟು ಪ್ರಾಣಿಗಳು', heatDetections: 'ಗರ್ಭಧಾರಣೆ ಪತ್ತೆ',
    infectionAlerts: 'ರೋಗ ಎಚ್ಚರಿಕೆ', pendingAppointments: 'ಬಾಕಿ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್',
    animalsBySpecies: 'ಜಾತಿಯ ಪ್ರಕಾರ ಪ್ರಾಣಿಗಳು', recentPredictions: 'ಇತ್ತೀಚಿನ AI ಫಲಿತಾಂಶ',
    govtCirculars: 'ಸರ್ಕಾರಿ ಸುತ್ತೋಲೆ ಮತ್ತು ಸಲಹೆ',
    // Heat Detection
    heatDetectionTitle: 'ಗರ್ಭಧಾರಣೆ ಸಮಯ ಪತ್ತೆ', selectAnimal: 'ಪ್ರಾಣಿ ಆಯ್ಕೆ ಮಾಡಿ',
    selectFemaleAnimal: '-- ಹೆಣ್ಣು ಪ್ರಾಣಿ ಆಯ್ಕೆ ಮಾಡಿ --',
    activitySpike: 'ಚಟುವಟಿಕೆ ಹೆಚ್ಚಳ', activityHint: 'ಪ್ರಾಣಿ ಎಂದಿಗಿಂತ ಹೆಚ್ಚು ಓಡಾಡುತ್ತಿದೆಯೇ?',
    restlessness: 'ಚಡಪಡಿಕೆ', restlessnessHint: 'ಪ್ರಾಣಿ ಚಡಪಡಿಸುತ್ತಿದೆಯೇ, ತಿನ್ನುತ್ತಿಲ್ಲವೇ?',
    mountingEvents: 'ಏರುವ ವರ್ತನೆ', mountingHint: 'ಪ್ರಾಣಿ ಇತರರ ಮೇಲೆ ಏರಲು ಪ್ರಯತ್ನಿಸುತ್ತಿದೆಯೇ?',
    visionScore: 'ದೃಶ್ಯ ಚಿಹ್ನೆಗಳು', visionHint: 'AI ತಪಾಸಣೆಗಾಗಿ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    runAnalysis: 'AI ವಿಶ್ಲೇಷಣೆ ಮಾಡಿ', analyzing: 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
    photoLabel: 'ಪ್ರಾಣಿಯ ಫೋಟೋ (ಹಿಂಭಾಗ/ಪಕ್ಕ)',
    // Results
    heatDetected: 'ಗರ್ಭಧಾರಣೆ ಸಮಯ ಪತ್ತೆಯಾಗಿದೆ!', noHeat: 'ಗರ್ಭಧಾರಣೆ ಸಮಯ ಇಲ್ಲ',
    confidence: 'ನಿಖರತೆ', bookNow: 'ಈಗಲೇ AI ಸೇವೆ ಬುಕ್ ಮಾಡಿ',
    nextHeat: 'ಮುಂದಿನ ಗರ್ಭಧಾರಣೆ ಸಮಯ', watchFor: 'ಈ ಚಿಹ್ನೆಗಳನ್ನು ಗಮನಿಸಿ',
    bestWindow: 'AI ಗೆ ಉತ್ತಮ ಸಮಯ', callCentre: 'AI ಕೇಂದ್ರಕ್ಕೆ ಕರೆ ಮಾಡಿ',
    // Common
    low: 'ಕಡಿಮೆ', high: 'ಹೆಚ್ಚು', none: 'ಇಲ್ಲ', severe: 'ತೀವ್ರ',
    save: 'ಉಳಿಸಿ', cancel: 'ರದ್ದು', edit: 'ತಿದ್ದು', delete: 'ಅಳಿಸಿ',
    register: 'ನೋಂದಾಯಿಸಿ', loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    // Milk
    milkTrackerTitle: 'ಹಾಲು ಉತ್ಪಾದನೆ ದಾಖಲೆ', addRecord: 'ದಾಖಲೆ ಸೇರಿಸಿ',
    morning: 'ಬೆಳಿಗ್ಗೆ', evening: 'ಸಂಜೆ', totalLitres: 'ಒಟ್ಟು ಲೀಟರ್',
    // Vaccination
    vaccinationTitle: 'ಲಸಿಕೆ ದಾಖಲೆ', addVaccination: 'ಲಸಿಕೆ ಸೇರಿಸಿ',
    vaccineName: 'ಲಸಿಕೆ ಹೆಸರು', dueDate: 'ದಿನಾಂಕ', given: 'ನೀಡಲಾಗಿದೆ', due: 'ಬಾಕಿ',
  },
  hi: {
    // Nav
    dashboard: 'डैशबोर्ड', myAnimals: 'मेरे पशु', heatDetection: 'गर्भाधान समय',
    healthCheck: 'स्वास्थ्य जांच', appointments: 'अपॉइंटमेंट', logout: 'लॉग आउट',
    milkTracker: 'दूध रिकॉर्ड', vaccination: 'टीकाकरण', history: 'इतिहास',
    // Dashboard
    welcome: 'नमस्ते', totalAnimals: 'कुल पशु', heatDetections: 'गर्भाधान पहचान',
    infectionAlerts: 'बीमारी चेतावनी', pendingAppointments: 'बकाया अपॉइंटमेंट',
    animalsBySpecies: 'प्रजाति अनुसार पशु', recentPredictions: 'हाल की AI जांच',
    govtCirculars: 'सरकारी परिपत्र और सलाह',
    // Heat Detection
    heatDetectionTitle: 'गर्भाधान समय पहचान', selectAnimal: 'पशु चुनें',
    selectFemaleAnimal: '-- मादा पशु चुनें --',
    activitySpike: 'गतिविधि बढ़ोतरी', activityHint: 'क्या पशु सामान्य से अधिक घूम रहा है?',
    restlessness: 'बेचैनी', restlessnessHint: 'क्या पशु बेचैन है, खाना नहीं खा रहा?',
    mountingEvents: 'चढ़ने का व्यवहार', mountingHint: 'क्या पशु दूसरों पर चढ़ने की कोशिश कर रहा है?',
    visionScore: 'दृश्य संकेत', visionHint: 'AI जांच के लिए फोटो अपलोड करें',
    runAnalysis: 'AI जांच करें', analyzing: 'जांच हो रही है...',
    photoLabel: 'पशु की फोटो (पीछे/बगल से)',
    // Results
    heatDetected: 'गर्भाधान समय मिला!', noHeat: 'गर्भाधान समय नहीं',
    confidence: 'सटीकता', bookNow: 'अभी AI सेवा बुक करें',
    nextHeat: 'अगला गर्भाधान समय', watchFor: 'इन संकेतों पर ध्यान दें',
    bestWindow: 'AI के लिए सबसे अच्छा समय', callCentre: 'AI केंद्र को कॉल करें',
    // Common
    low: 'कम', high: 'अधिक', none: 'नहीं', severe: 'गंभीर',
    save: 'सहेजें', cancel: 'रद्द', edit: 'संपादित', delete: 'हटाएं',
    register: 'पंजीकरण', loading: 'लोड हो रहा है...',
    // Milk
    milkTrackerTitle: 'दूध उत्पादन रिकॉर्ड', addRecord: 'रिकॉर्ड जोड़ें',
    morning: 'सुबह', evening: 'शाम', totalLitres: 'कुल लीटर',
    // Vaccination
    vaccinationTitle: 'टीकाकरण रिकॉर्ड', addVaccination: 'टीका जोड़ें',
    vaccineName: 'टीके का नाम', dueDate: 'तारीख', given: 'दिया गया', due: 'बकाया',
  },
};

// Sarvam AI translation for dynamic content (AI results, recommendations)
export async function translateWithSarvam(text, targetLang) {
  if (targetLang === 'en' || !text) return text;
  const langMap = { kn: 'kn-IN', hi: 'hi-IN' };
  const target = langMap[targetLang];
  if (!target) return text;

  try {
    const res = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': import.meta.env.VITE_SARVAM_API_KEY || '',
      },
      body: JSON.stringify({
        input: text,
        source_language_code: 'en-IN',
        target_language_code: target,
        speaker_gender: 'Male',
        mode: 'formal',
        model: 'mayura:v1',
        enable_preprocessing: true,
      }),
    });
    if (!res.ok) return text;
    const data = await res.json();
    return data.translated_text || text;
  } catch {
    return text; // fallback to English if API fails
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  const t = useCallback((key) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
  }, [lang]);

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, t, changeLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
