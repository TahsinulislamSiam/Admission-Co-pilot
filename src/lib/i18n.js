import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import bn from '@/locales/bn.json'
import en from '@/locales/en.json'
import { STORAGE_KEYS } from '@/lib/constants'

// Default language is Bangla; user's explicit choice is persisted.
const stored =
  typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.language) : null
const initialLang = stored === 'en' || stored === 'bn' ? stored : 'bn'

i18n.use(initReactI18next).init({
  resources: {
    bn: { translation: bn },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: 'bn',
  interpolation: { escapeValue: false },
})

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language
}

export default i18n
