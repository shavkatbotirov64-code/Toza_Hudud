import { useAppContext } from '../context/AppContext'
import { uz } from '../locales/uz'
import { ru } from '../locales/ru'
import { en } from '../locales/en'

const translations = {
  uz,
  ru,
  en
}

export const useTranslation = () => {
  const { language } = useAppContext()

  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations[language] || translations.uz

    // Navigate through nested object
    for (const k of keys) {
      value = value?.[k]
    }

    // If translation not found, try fallback to Uzbek
    if (!value && language !== 'uz') {
      let fallback = translations.uz
      for (const k of keys) {
        fallback = fallback?.[k]
      }
      value = fallback
    }

    // If still not found, return the key itself
    if (!value) {
      console.warn(`Translation missing for key: ${key} in language: ${language}`)
      return key
    }

    // Replace parameters in the string
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] || match
      })
    }

    return value
  }

  const getLanguageName = (lang) => {
    const names = {
      uz: "O'zbekcha",
      ru: "Русский", 
      en: "English"
    }
    return names[lang] || lang
  }

  const getAvailableLanguages = () => {
    return [
      { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      { code: 'en', name: 'English', flag: '🇺🇸' }
    ]
  }

  return {
    t,
    language,
    getLanguageName,
    getAvailableLanguages
  }
}