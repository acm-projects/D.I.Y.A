import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";                    
import HttpApi from "i18next-http-backend";  
import { initReactI18next } from "react-i18next";

export const supportedLanguages = {
    ar: "Aarabic",
    bn: "Bengali",
    en: "English",
    es: "Spanish",
    fr: "French",
    hi: "Hindi",
    id: "Indonesian",
    ja: "Japanese",
    pt: "Portuguese",
    ru: "Russian",
    zh: "Chinese",
}

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({                
    fallbackLng: "en",
    debug: true,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;