import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage } from '../contexts/LanguageContext'
import { FiSettings, FiUser, FiLock, FiMoon, FiSun, FiGlobe, FiSave, FiX, FiCamera } from 'react-icons/fi'

interface SettingsProps {
  onClose: () => void
}

const Settings = ({ onClose }: SettingsProps) => {
  const { user, updateCredentials, updateProfile, updateAvatar } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'credentials'>('profile')
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [newLogin, setNewLogin] = useState(user?.login || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSaveProfile = () => {
    if (name.trim() && phone.trim()) {
      updateProfile(name, phone)
      if (avatar) {
        updateAvatar(avatar)
      }
      setSuccess(t('success'))
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 1500)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Fayl o'lchamini tekshirish (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Rasm hajmi 2MB dan katta bo\'lmasligi kerak')
        return
      }
      
      // Rasm formatini tekshirish
      if (!file.type.startsWith('image/')) {
        setError('Faqat rasm fayllari qabul qilinadi')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setAvatar(base64String)
        setError('')
      }
      reader.onerror = () => {
        setError('Rasm yuklashda xatolik yuz berdi')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatar('')
    updateAvatar('')
  }

  const handleSaveCredentials = () => {
    setError('')
    setSuccess('')
    
    if (!newLogin.trim()) {
      setError('Login bo\'sh bo\'lishi mumkin emas')
      return
    }
    
    if (newPassword && newPassword !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }
    
    if (newPassword) {
      updateCredentials(newLogin, newPassword)
    } else {
      updateCredentials(newLogin, user?.password || 'password')
    }
    
    setSuccess(t('success'))
    setTimeout(() => {
      setSuccess('')
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1050] flex items-center justify-center p-2 sm:p-4">
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl sm:rounded-2xl shadow-2xl border w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto`}>
        <div className={`sticky top-0 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-4 sm:p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <FiSettings className="text-white text-base sm:text-lg" />
            </div>
            <h2 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('settings')}</h2>
          </div>
          <button
            onClick={onClose}
            className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
          >
            <FiX className="text-xl sm:text-2xl" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Tabs */}
          <div className={`flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                activeTab === 'profile'
                  ? `text-blue-400 border-b-2 border-blue-400 ${theme === 'dark' ? '' : 'text-blue-600'}`
                  : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiUser className="inline mr-1 sm:mr-2" />
              {t('profile')}
            </button>
            <button
              onClick={() => setActiveTab('credentials')}
              className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                activeTab === 'credentials'
                  ? `text-blue-400 border-b-2 border-blue-400 ${theme === 'dark' ? '' : 'text-blue-600'}`
                  : theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FiLock className="inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('changeLogin')} / {t('changePassword')}</span>
              <span className="sm:hidden">{t('credentials')}</span>
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-3 sm:space-y-4">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Profile" 
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-blue-500"
                    />
                  ) : (
                    <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center border-4 border-blue-500 ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <FiUser className="text-4xl sm:text-5xl text-gray-400" />
                    </div>
                  )}
                  {avatar && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
                      title={t('removePhoto')}
                    >
                      <FiX className="text-sm" />
                    </button>
                  )}
                </div>
                <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}>
                  <FiCamera className="text-base" />
                  <span className="text-sm font-medium">{avatar ? t('changePhoto') : t('uploadPhoto')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t('name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t('phone')}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <button
                onClick={handleSaveProfile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <FiSave />
                {t('save')}
              </button>
            </div>
          )}

          {/* Credentials Tab */}
          {activeTab === 'credentials' && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t('newLogin')}
                </label>
                <input
                  type="text"
                  value={newLogin}
                  onChange={(e) => setNewLogin(e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t('newPassword')}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  placeholder={t('newPassword')}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {t('confirmPassword')}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-white'
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                  placeholder={t('confirmPassword')}
                />
              </div>
              {(error || success) && (
                <div className={`rounded-lg p-3 text-sm ${
                  error 
                    ? 'bg-red-500/20 border border-red-500/50 text-red-300' 
                    : 'bg-green-500/20 border border-green-500/50 text-green-300'
                }`}>
                  {error || success}
                </div>
              )}
              <button
                onClick={handleSaveCredentials}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <FiSave />
                {t('save')}
              </button>
            </div>
          )}

          {/* Theme and Language */}
          <div className={`mt-6 sm:mt-8 pt-4 sm:pt-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} space-y-3 sm:space-y-4`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                {theme === 'dark' ? <FiMoon className="text-gray-400" /> : <FiSun className="text-gray-500" />}
                <span className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('theme')}</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-white'
                    : 'bg-yellow-500 text-gray-900'
                }`}
              >
                {theme === 'dark' ? t('dark') : t('light')}
              </button>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <FiGlobe className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t('language')}</span>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => setLanguage('uz')}
                  className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors ${
                    language === 'uz'
                      ? 'bg-blue-600 text-white'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {t('uzbek')}
                </button>
                <button
                  onClick={() => setLanguage('ru')}
                  className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg transition-colors ${
                    language === 'ru'
                      ? 'bg-blue-600 text-white'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {t('russian')}
                </button>
              </div>
            </div>
          </div>

          {success && (
            <div className="mt-3 sm:mt-4 bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-300 text-sm text-center">
              {success}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings



