import React from 'react'

const LoadingScreen = () => {
  return (
    <div id="loadingScreen" className="loading-screen">
      <div className="loader">
        <div className="loader-ring"></div>
        <div className="loader-text">
          Smart Trash System<br />
          <small>Yuklanmoqda...</small>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen

