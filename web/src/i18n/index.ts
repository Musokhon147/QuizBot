import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import uz from "./uz.ts";
import ru from "./ru.ts";
import en from "./en.ts";

const savedLang = localStorage.getItem("app-lang") || "uz";

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: "uz",
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: string) {
  i18n.changeLanguage(lang);
  localStorage.setItem("app-lang", lang);
}

export default i18n;
