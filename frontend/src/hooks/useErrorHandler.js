import { useCallback } from 'react'
import { useAppContext } from '../context/AppContext'

export const useErrorHandler = () => {
  const { showToast } = useAppContext()

  const handleError = useCallback((error, context = '') => {
    console.error(`🚨 Error in ${context}:`, error)

    // Determine error type and show appropriate message
    let message = 'Noma\'lum xatolik yuz berdi'
    let type = 'error'

    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      message = 'Internet aloqasi bilan muammo. Iltimos, qaytadan urinib ko\'ring.'
      type = 'warning'
    } else if (error.message.includes('400')) {
      message = 'Noto\'g\'ri ma\'lumot yuborildi. Iltimos, tekshirib ko\'ring.'
    } else if (error.message.includes('401')) {
      message = 'Avtorizatsiya talab qilinadi. Iltimos, qaytadan kiring.'
    } else if (error.message.includes('403')) {
      message = 'Bu amalni bajarish uchun ruxsat yo\'q.'
    } else if (error.message.includes('404')) {
      message = 'So\'ralgan ma\'lumot topilmadi.'
    } else if (error.message.includes('409')) {
      message = 'Bu ma\'lumot allaqachon mavjud.'
    } else if (error.message.includes('500')) {
      message = 'Server xatosi. Iltimos, keyinroq qaytadan urinib ko\'ring.'
    } else if (error.message) {
      message = error.message
    }

    // Show toast notification
    showToast(message, type)

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      logErrorToService(error, context)
    }

    return { message, type }
  }, [showToast])

  const handleAsyncError = useCallback(async (asyncFunction, context = '') => {
    try {
      return await asyncFunction()
    } catch (error) {
      handleError(error, context)
      throw error // Re-throw so caller can handle if needed
    }
  }, [handleError])

  const handlePromise = useCallback((promise, context = '') => {
    return promise.catch(error => {
      handleError(error, context)
      return Promise.reject(error)
    })
  }, [handleError])

  return {
    handleError,
    handleAsyncError,
    handlePromise
  }
}

// Helper function to log errors to external service
const logErrorToService = (error, context) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    context: context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: localStorage.getItem('userId') || 'anonymous'
  }

  // Here you would send to your error tracking service
  // Example: Sentry, LogRocket, Bugsnag, etc.
  console.log('📊 Error logged to service:', errorData)
}