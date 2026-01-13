import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

const resources = {
  en: {
    translation: enTranslations
  },
  ar: {
    translation: arTranslations
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    supportedLngs: ['en', 'ar'],
    debug: false,
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      // Prefer saved setting, then HTML tag, then browser
      order: ['localStorage', 'htmlTag', 'navigator'],
      caches: ['localStorage'],
    },
    
    // RTL support for Arabic
    react: {
      useSuspense: false
    }
  });

// Apply direction and lang for current language
const applyDirection = (lng: string) => {
  if (lng === 'ar') {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'en');
  }
};

applyDirection(i18n.language);

// Update direction when language changes
i18n.on('languageChanged', (lng) => {
  applyDirection(lng);
});

export default i18n;