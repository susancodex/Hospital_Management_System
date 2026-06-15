import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ne from './ne.json';

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('aethercare_lang') || 'en' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ne: { translation: ne },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export function setLanguage(lang) {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') localStorage.setItem('aethercare_lang', lang);
}

export function getCurrentLanguage() {
  return i18n.language;
}

export default i18n;
