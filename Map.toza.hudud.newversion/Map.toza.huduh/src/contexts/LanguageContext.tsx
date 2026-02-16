import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

type Language = 'uz' | 'ru'

interface Translations {
  [key: string]: {
    uz: string
    ru: string
  }
}

const translations: Translations = {
  login: { uz: 'Kirish', ru: 'Вход' },
  password: { uz: 'Parol', ru: 'Пароль' },
  enter: { uz: 'Kirish', ru: 'Войти' },
  driver: { uz: 'Haydovchi', ru: 'Водитель' },
  information: { uz: 'Ma\'lumotlar', ru: 'Информация' },
  name: { uz: 'Ism', ru: 'Имя' },
  phone: { uz: 'Telefon', ru: 'Телефон' },
  status: { uz: 'Holat', ru: 'Статус' },
  working: { uz: 'Ishlayapti', ru: 'Работает' },
  onBreak: { uz: 'Tanaffusda', ru: 'На перерыве' },
  offDuty: { uz: 'Ishdan chiqdi', ru: 'Вышел с работы' },
  vehicle: { uz: 'Transport', ru: 'Транспорт' },
  vehicleInfo: { uz: 'Mashina ma\'lumotlari', ru: 'Информация о машине' },
  plateNumber: { uz: 'Raqam', ru: 'Номер' },
  model: { uz: 'Model', ru: 'Модель' },
  capacity: { uz: 'Sig\'im', ru: 'Вместимость' },
  tons: { uz: 'tonna', ru: 'тонн' },
  currentLoad: { uz: 'Joriy yuk', ru: 'Текущий груз' },
  loadingStatus: { uz: 'Yuklanish', ru: 'Загрузка' },
  operational: { uz: 'Ishlayapti', ru: 'Работает' },
  maintenance: { uz: 'Ta\'mirlashda', ru: 'В ремонте' },
  statistics: { uz: 'Statistika', ru: 'Статистика' },
  dailyData: { uz: 'Kunlik ma\'lumotlar', ru: 'Дневные данные' },
  totalContainers: { uz: 'Jami qutilar', ru: 'Всего контейнеров' },
  completed: { uz: 'Bajarildi', ru: 'Выполнено' },
  remaining: { uz: 'Qolgan', ru: 'Осталось' },
  averageTime: { uz: 'O\'rtacha vaqt', ru: 'Среднее время' },
  minutes: { uz: 'min', ru: 'мин' },
  distance: { uz: 'Masofa', ru: 'Расстояние' },
  kmShort: { uz: 'km', ru: 'км' },
  selectedContainer: { uz: 'Tanlangan quti', ru: 'Выбранный контейнер' },
  address: { uz: 'Manzil', ru: 'Адрес' },
  fillLevel: { uz: 'To\'ldirilish', ru: 'Заполненность' },
  priority: { uz: 'Ustuvorlik', ru: 'Приоритет' },
  high: { uz: 'Yuqori', ru: 'Высокий' },
  medium: { uz: 'O\'rtacha', ru: 'Средний' },
  low: { uz: 'Past', ru: 'Низкий' },
  lastEmptied: { uz: 'Oxirgi bo\'shatilgan', ru: 'Последний раз опорожнен' },
  containers: { uz: 'Qutilar', ru: 'Контейнеры' },
  left: { uz: 'qolgan', ru: 'осталось' },
  driverLocation: { uz: 'Haydovchi joylashuvi', ru: 'Местоположение водителя' },
  currentPosition: { uz: 'Joriy pozitsiya', ru: 'Текущая позиция' },
  container: { uz: 'Quti', ru: 'Контейнер' },
  highPriority: { uz: 'Yuqori ustuvorlik', ru: 'Высокий приоритет' },
  logout: { uz: 'Chiqish', ru: 'Выход' },
  settings: { uz: 'Sozlamalar', ru: 'Настройки' },
  profile: { uz: 'Profil', ru: 'Профиль' },
  changeLogin: { uz: 'Login o\'zgartirish', ru: 'Изменить логин' },
  changePassword: { uz: 'Parol o\'zgartirish', ru: 'Изменить пароль' },
  newLogin: { uz: 'Yangi login', ru: 'Новый логин' },
  newPassword: { uz: 'Yangi parol', ru: 'Новый пароль' },
  confirmPassword: { uz: 'Parolni tasdiqlash', ru: 'Подтвердить пароль' },
  save: { uz: 'Saqlash', ru: 'Сохранить' },
  cancel: { uz: 'Bekor qilish', ru: 'Отмена' },
  editProfile: { uz: 'Profilni tahrirlash', ru: 'Редактировать профиль' },
  edit: { uz: 'Tahrirlash', ru: 'Редактировать' },
  theme: { uz: 'Tema', ru: 'Тема' },
  dark: { uz: 'Qorong\'i', ru: 'Темная' },
  light: { uz: 'Yorug\'', ru: 'Светлая' },
  language: { uz: 'Til', ru: 'Язык' },
  uzbek: { uz: 'O\'zbek', ru: 'Узбекский' },
  russian: { uz: 'Rus', ru: 'Русский' },
  loginError: { uz: 'Noto\'g\'ri login yoki parol', ru: 'Неверный логин или пароль' },
  passwordMismatch: { uz: 'Parollar mos kelmaydi', ru: 'Пароли не совпадают' },
  success: { uz: 'Muvaffaqiyatli saqlandi', ru: 'Успешно сохранено' },
  credentials: { uz: 'Kirish ma\'lumotlari', ru: 'Учетные данные' },
  uploadPhoto: { uz: 'Rasm yuklash', ru: 'Загрузить фото' },
  changePhoto: { uz: 'Rasmni o\'zgartirish', ru: 'Изменить фото' },
  removePhoto: { uz: 'Rasmni o\'chirish', ru: 'Удалить фото' },
  search: { uz: 'Qidirish', ru: 'Поиск' },
  filter: { uz: 'Filtrlash', ru: 'Фильтр' },
  notifications: { uz: 'Xabarnomalar', ru: 'Уведомления' },
  allBins: { uz: 'Barcha qutilar', ru: 'Все контейнеры' },
  fullBins: { uz: 'To\'la qutilar', ru: 'Полные контейнеры' },
  warningBins: { uz: 'Ogohlantirish', ru: 'Предупреждение' },
  emptyBins: { uz: 'Bo\'sh qutilar', ru: 'Пустые контейнеры' },
  vehicles: { uz: 'Mashinalar', ru: 'Машины' },
  noResults: { uz: 'Natija topilmadi', ru: 'Результаты не найдены' },
  clear: { uz: 'Tozalash', ru: 'Очистить' },
  mapLegend: { uz: 'Xarita belgisi', ru: 'Легенда карты' },
  wasteBins: { uz: 'Chiqindi qutilar:', ru: 'Мусорные контейнеры:' },
  empty: { uz: 'Bo\'sh', ru: 'Пустой' },
  half: { uz: 'Yarim', ru: 'Половина' },
  warning: { uz: 'Ogohlantirish', ru: 'Предупреждение' },
  full: { uz: 'To\'la', ru: 'Полный' },
  trucks: { uz: 'Yuk mashinalari:', ru: 'Грузовые машины:' },
  moving: { uz: 'Harakatda', ru: 'В движении' },
  active: { uz: 'Faol', ru: 'Активный' },
  inactive: { uz: 'Faol emas', ru: 'Неактивный' },
  onDutyStatus: { uz: 'Ishda', ru: 'На работе' },
  onBreakStatus: { uz: 'Tanaffusda', ru: 'На перерыве' },
  offDutyStatus: { uz: 'Ishda emas', ru: 'Не на работе' },
  bin: { uz: 'Quti', ru: 'Контейнер' },
  driverName: { uz: 'Haydovchi', ru: 'Водитель' },
  vehicleName: { uz: 'Transport', ru: 'Транспорт' },
  statisticsData: { uz: 'Statistika', ru: 'Статистика' },
  data: { uz: 'Ma\'lumotlar', ru: 'Данные' },
  speed: { uz: 'Tezlik', ru: 'Скорость' },
  fuel: { uz: 'Yoqilg\'i', ru: 'Топливо' },
  target: { uz: 'Maqsad', ru: 'Цель' },
  route: { uz: 'Yo\'l', ru: 'Маршрут' },
  routePoints: { uz: 'Yo\'l nuqtalari', ru: 'Точки маршрута' },
  movingToBin: { uz: 'Qutiga bormoqda', ru: 'Едет к контейнеру' },
  arrived: { uz: 'Yetib keldi', ru: 'Прибыл' },
  patrolling: { uz: 'Aylanib yurmoqda', ru: 'Патрулирует' },
  statusInfo: { uz: 'Holat', ru: 'Статус' },
  capacityInfo: { uz: 'Sig\'im', ru: 'Вместимость' },
  all: { uz: 'Barchasi', ru: 'Все' },
  fullBinsFilter: { uz: 'To\'la qutilar', ru: 'Полные контейнеры' },
  warningBinsFilter: { uz: 'Ogohlantirish', ru: 'Предупреждение' },
  emptyBinsFilter: { uz: 'Bo\'sh', ru: 'Пустые' },
  vehiclesFilter: { uz: 'Mashinalar', ru: 'Машины' },
  containersCount: { uz: 'Qutilar', ru: 'Контейнеры' },
  remainingCount: { uz: 'qoldi', ru: 'осталось' },
  workingStatus: { uz: 'Ishlamoqda', ru: 'Работает' },
  underMaintenance: { uz: 'Ta\'mirlash', ru: 'Ремонт' },
  tonsWeight: { uz: 'tonna', ru: 'тонн' },
  currentLoadInfo: { uz: 'Hozirgi yuk', ru: 'Текущий груз' },
  loadingInfo: { uz: 'Yuklanish', ru: 'Загрузка' },
  totalContainersRoute: { uz: 'Jami qutilar', ru: 'Всего контейнеров' },
  completedRoute: { uz: 'Bajarilgan', ru: 'Выполнено' },
  averageTimeRoute: { uz: 'O\'rtacha vaqt', ru: 'Среднее время' },
  minutesLong: { uz: 'daqiqa', ru: 'минут' },
  totalDistance: { uz: 'Masofa', ru: 'Расстояние' },
  km: { uz: 'km', ru: 'км' },
  tryOtherSearch: { uz: 'Boshqa so\'z bilan qidiring', ru: 'Попробуйте другой поиск' },
  routes: { uz: 'Yo\'nalishlar', ru: 'Маршруты' },
  almostFull: { uz: 'Deyarli to\'la', ru: 'Почти полный' },
  workStarted: { uz: 'Ishni boshladim', ru: 'Начал работу' },
  workEnded: { uz: 'Ishni tugatdim', ru: 'Завершил работу' },
  vehicleBreakdown: { uz: 'Mashinada nosozlik', ru: 'Поломка машины' },
  contactAdmin: { uz: 'Admin bilan bog\'lanish', ru: 'Связаться с администратором' },
  statusUpdated: { uz: 'Holat yangilandi', ru: 'Статус обновлен' },
  callingAdmin: { uz: 'Adminga qo\'ng\'iroq qilinmoqda...', ru: 'Звонок администратору...' },
  appName: { uz: 'Toza Hudud', ru: 'Чистая Территория' },
  liveMap: { uz: 'Jonli Xarita', ru: 'Живая Карта' },
  mapStyle: { uz: 'Xarita stili', ru: 'Стиль карты' },
  bins: { uz: 'qutilar', ru: 'контейнеры' }
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language')
    return (saved as Language) || 'uz'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  const t = (key: string): string => {
    return translations[key]?.[language] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

