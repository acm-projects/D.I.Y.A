import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";                    
import HttpApi from "i18next-http-backend";  
import { initReactI18next } from "react-i18next";

export const supportedLanguages = {
    bn: "Bengali (বাংলা)",
    en: "English",
    es: "Spanish (Español)",
    fr: "French (Français)",
    hi: "Hindi (हिन्दी)",
    id: "Indonesian (Bahasa Indonesia)",
    ja: "Japanese (日本語)",
    pt: "Portuguese (Português)",
    ru: "Russian (Русский)",
    zh: "Chinese (中文)",
};

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