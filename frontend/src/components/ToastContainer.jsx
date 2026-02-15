import React from 'react'
import { useAppContext } from '../context/AppContext'

const ToastContainer = () => {
  const { toasts, removeToast } = useAppContext()

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return 'fa-check-circle'
      case 'warning':
        return 'fa-exclamation-triangle'
      case 'danger':
        return 'fa-times-circle'
      default:
        return 'fa-info-circle'
    }
  }

  return (
    <div id="toastContainer" className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          <div className="toast-icon">
            <i className={`fas ${getIcon(toast.type)}`}></i>
          </div>
          <div className="toast-content">
            <div className="toast-title">
              {toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}
            </div>
            <div className="toast-message">{toast.message}</div>
          </div>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer

