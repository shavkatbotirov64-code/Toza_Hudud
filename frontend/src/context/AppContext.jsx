import React, { createContext, useContext, useState, useEffect } from 'react'
import { mockBins, mockVehicles, mockActivities, mockAlerts } from '../data/mockData'
import ApiService from '../services/api'

const AppContext = createContext()

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })
  const [language, setLanguage] = useState(() => {
    // localStorage'dan tilni olish
    const savedLanguage = localStorage.getItem('language')
    
    // Agar saqlangan til mavjud va qo'llab-quvvatlanadigan tillardan biri bo'lsa
    if (savedLanguage && ['uz', 'ru', 'en'].includes(savedLanguage)) {
      return savedLanguage
    }
    
    // Default o'zbek tili
    return 'uz'
  })
  
  // Data states - start with empty arrays, will be populated from API
  const [binsData, setBinsData] = useState([]) // Bo'sh array - faqat API dan
  const [vehiclesData, setVehiclesData] = useState([]) // Bo'sh array - faqat API dan
  const [activityData, setActivityData] = useState(mockActivities)
  const [alertsData, setAlertsData] = useState([])
  const [toasts, setToasts] = useState([])
  
  // API states
  const [apiConnected, setApiConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('lang', language)
    localStorage.setItem('language', language)
  }, [language])

  // Load data from API
  const loadDataFromAPI = async () => {
    console.log('🔄 Loading data from API...')
    
    try {
      // Test API connection first
      const connectionTest = await ApiService.testConnection()
      console.log('🔗 API Connection Test:', connectionTest)
      
      if (connectionTest.success) {
        setApiConnected(true)
        console.log('✅ API connected successfully')
        
        // Load bins
        const binsResult = await ApiService.getBins()
        console.log('📦 Bins Result:', binsResult)
        console.log('📦 Bins Result Data:', binsResult.data)
        console.log('📦 Bins Result Data Type:', typeof binsResult.data)
        
        try {
          if (binsResult.success && binsResult.data) {
            let binsArray = binsResult.data
            
            // Agar data object bo'lsa va data property'si bo'lsa
            if (typeof binsResult.data === 'object' && !Array.isArray(binsResult.data) && binsResult.data.data) {
              binsArray = binsResult.data.data
              console.log('📦 Using nested data array:', binsArray)
            }
            
            console.log('📦 BinsArray:', binsArray)
            console.log('📦 BinsArray length:', binsArray?.length)
            console.log('📦 BinsArray is Array:', Array.isArray(binsArray))
            
            if (Array.isArray(binsArray) && binsArray.length > 0) {
              console.log('📦 Processing bins array:', binsArray.length, 'items')
              console.log('📦 First bin raw data:', binsArray[0])
              
              const transformedBins = binsArray.map((bin, index) => {
                try {
                  console.log(`📦 Transforming bin ${index + 1}:`, bin)
                  const transformed = ApiService.transformBinData(bin)
                  console.log(`✅ Bin ${index + 1} transformed:`, transformed)
                  return transformed
                } catch (error) {
                  console.error(`❌ Error transforming bin ${index + 1}:`, error)
                  console.error('❌ Bin data:', bin)
                  return null
                }
              }).filter(bin => bin !== null) // Remove failed transformations
              
              console.log('📦 Transformed Bins:', transformedBins)
              console.log('📦 Setting binsData with', transformedBins.length, 'bins')
              
              if (transformedBins.length > 0) {
                setBinsData(transformedBins)
                console.log('✅ BinsData set successfully')
              } else {
                console.warn('⚠️ No bins could be transformed')
              }
            } else {
              console.log('📦 No bins data or empty array')
              console.log('📦 BinsArray:', binsArray)
            }
          } else {
            console.log('📦 API call failed or no data')
            console.log('📦 binsResult.success:', binsResult.success)
            console.log('📦 binsResult.data:', binsResult.data)
          }
        } catch (error) {
          console.error('❌ Error processing bins data:', error)
          console.error('❌ Error stack:', error.stack)
          showToast('Qutilar ma\'lumotini yuklashda xatolik', 'error')
        }
        
        // Load vehicles
        const vehiclesResult = await ApiService.getVehicles()
        console.log('🚛 Vehicles Result:', vehiclesResult)
        
        try {
          if (vehiclesResult.success && vehiclesResult.data) {
            let vehiclesArray = vehiclesResult.data
            
            // Agar data object bo'lsa va data property'si bo'lsa
            if (typeof vehiclesResult.data === 'object' && !Array.isArray(vehiclesResult.data) && vehiclesResult.data.data) {
              vehiclesArray = vehiclesResult.data.data
              console.log('🚛 Using nested data array:', vehiclesArray)
            }
            
            if (Array.isArray(vehiclesArray) && vehiclesArray.length > 0) {
              console.log('🚛 Processing vehicles array:', vehiclesArray.length, 'items')
              
              const transformedVehicles = vehiclesArray.map((vehicle, index) => {
                try {
                  console.log(`🚛 Transforming vehicle ${index + 1}:`, vehicle)
                  return ApiService.transformVehicleData(vehicle)
                } catch (error) {
                  console.error(`❌ Error transforming vehicle ${index + 1}:`, error)
                  console.error('❌ Vehicle data:', vehicle)
                  return null
                }
              }).filter(vehicle => vehicle !== null) // Remove failed transformations
              
              console.log('🚛 Transformed Vehicles:', transformedVehicles)
              
              if (transformedVehicles.length > 0) {
                setVehiclesData(transformedVehicles)
              } else {
                console.warn('⚠️ No vehicles could be transformed')
              }
            } else {
              console.log('🚛 No vehicles data or empty array')
              console.log('🚛 VehiclesArray:', vehiclesArray)
            }
          } else {
            console.log('🚛 API call failed or no data')
          }
        } catch (error) {
          console.error('❌ Error processing vehicles data:', error)
          showToast('Transport vositalarini yuklashda xatolik', 'error')
        }
        
        // Load alerts
        const alertsResult = await ApiService.getAlerts()
        console.log('🚨 Alerts Result:', alertsResult)
        
        try {
          if (alertsResult.success && alertsResult.data) {
            let alertsArray = alertsResult.data
            
            // Agar data object bo'lsa va data property'si bo'lsa
            if (typeof alertsResult.data === 'object' && !Array.isArray(alertsResult.data) && alertsResult.data.data) {
              alertsArray = alertsResult.data.data
              console.log('🚨 Using nested data array:', alertsArray)
            }
            
            if (Array.isArray(alertsArray) && alertsArray.length > 0) {
              console.log('🚨 Processing alerts array:', alertsArray.length, 'items')
              
              const transformedAlerts = alertsArray.map((alert, index) => {
                try {
                  console.log(`🚨 Transforming alert ${index + 1}:`, alert)
                  return ApiService.transformAlertData(alert)
                } catch (error) {
                  console.error(`❌ Error transforming alert ${index + 1}:`, error)
                  console.error('❌ Alert data:', alert)
                  return null
                }
              }).filter(alert => alert !== null) // Remove failed transformations
              
              console.log('🚨 Transformed Alerts:', transformedAlerts)
              
              if (transformedAlerts.length > 0) {
                setAlertsData(transformedAlerts)
              } else {
                console.warn('⚠️ No alerts could be transformed')
              }
            } else {
              console.log('🚨 No alerts data or empty array')
              console.log('🚨 AlertsArray:', alertsArray)
            }
          } else {
            console.log('🚨 API call failed or no data')
          }
        } catch (error) {
          console.error('❌ Error processing alerts data:', error)
          showToast('Ogohlantirishlarni yuklashda xatolik', 'error')
        }
        
        showToast('Ma\'lumotlar muvaffaqiyatli yuklandi', 'success')
      } else {
        setApiConnected(false)
        console.warn('⚠️ API ga ulanib bo\'lmadi')
        showToast('API ga ulanib bo\'lmadi. Iltimos, backend ishga tushganini tekshiring.', 'warning')
      }
    } catch (error) {
      console.error('❌ API yuklash xatosi:', error)
      setApiConnected(false)
      showToast('Ma\'lumotlarni yuklashda xatolik. Backend ishlamayapti.', 'error')
    } finally {
      setLoading(false)
      console.log('🏁 Data loading completed')
    }
  }

  // Initial data load
  useEffect(() => {
    loadDataFromAPI()
  }, [])

  // Auto refresh every 30 seconds if API is connected
  useEffect(() => {
    if (!apiConnected) return

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing data...')
      loadDataFromAPI()
    }, 30000)

    return () => clearInterval(interval)
  }, [apiConnected])

  // Real-time updates - faqat API connected bo'lganda
  useEffect(() => {
    if (!apiConnected) return // API yo'q bo'lsa, hech narsa qilmaymiz

    // API connected bo'lsa, WebSocket orqali real-time updates keladi
    // Bu yerda qo'shimcha kod kerak emas
  }, [apiConnected])

  const showToast = (message, type = 'info', duration = 5000) => {
    // Generate unique ID using timestamp + random number to avoid duplicates
    const id = Date.now() + Math.random()
    const toast = { id, message, type, duration }
    
    setToasts(prev => {
      // Prevent duplicate messages
      const existingToast = prev.find(t => t.message === message && t.type === type)
      if (existingToast) {
        return prev // Don't add duplicate
      }
      return [...prev, toast]
    })
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const refreshData = () => {
    setLoading(true)
    loadDataFromAPI()
  }

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        language,
        setLanguage,
        binsData,
        setBinsData,
        vehiclesData,
        setVehiclesData,
        activityData,
        setActivityData,
        alertsData,
        setAlertsData,
        apiConnected,
        loading,
        refreshData,
        showToast,
        toasts,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

