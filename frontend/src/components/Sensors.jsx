import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'

const Sensors = () => {
  const { showToast } = useAppContext()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('realtime')
  
  // State'lar
  const [sensorData, setSensorData] = useState([])
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState({
    totalReadings: 0,
    totalAlerts: 0,
    averageDistance: 0,
    lastReading: null,
    activeAlerts: 0
  })

  // API'dan ma'lumotlarni olish
  const loadSensorData = async () => {
    try {
      const API_BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3002'
        : 'https://tozahudud-production-d73f.up.railway.app'
      
      // Oxirgi sensor ma'lumotlari
      const dataResponse = await fetch(`${API_BASE_URL}/sensors/latest?limit=20`)
      const dataResult = await dataResponse.json()
      if (dataResult.success) {
        setSensorData(dataResult.data)
      }
      
      // Sensor alertlar - sensor oqimidan olingan real alertlar
      const alertsResponse = await fetch(`${API_BASE_URL}/sensors/alerts?limit=15`)
      const alertsResult = await alertsResponse.json()
      if (alertsResult.success) {
        const formattedAlerts = alertsResult.data.map(alert => ({
          id: alert.id,
          message: alert.message,
          binId: alert.binId || 'N/A',
          location: alert.location,
          timestamp: alert.timestamp || alert.createdAt,
          status: alert.status || 'active',
          distance: alert.distance ?? null
        }))
        setAlerts(formattedAlerts)
      }
      
      // Statistika
      const statsResponse = await fetch(`${API_BASE_URL}/sensors/stats`)
      const statsResult = await statsResponse.json()
      if (statsResult.success) {
        setStats(statsResult.data)
      }
      
    } catch (error) {
      console.error('Sensor ma\'lumotlarini yuklashda xatolik:', error)
      showToast('Ma\'lumotlar yuklanmadi', 'error')
    }
  }

  // Komponent yuklanganda va har 5 soniyada yangilash
  useEffect(() => {
    loadSensorData()
    
    const interval = setInterval(() => {
      loadSensorData()
    }, 5000) // 5 soniyada bir marta yangilash
    
    return () => clearInterval(interval)
  }, [])

  // Yangilash funksiyasi
  const refreshData = () => {
    loadSensorData()
  }

  // Masofa rangini aniqlash
  const getDistanceColor = (distance) => {
    if (distance <= 10) return '#dc3545' // Qizil - juda to'la
    if (distance <= 30) return '#ffc107' // Sariq - to'la
    if (distance <= 50) return '#fd7e14' // Orange - yarim
    return '#28a745' // Yashil - bo'sh
  }

  // Masofa holatini aniqlash
  const getDistanceStatus = (distance) => {
    if (distance <= 10) return 'Juda to\'la'
    if (distance <= 30) return 'To\'la'
    if (distance <= 50) return 'Yarim to\'la'
    return 'Bo\'sh'
  }

  return (
    <div className="content-card">
      <div className="card-header">
        <div>
          <h3><i className="fas fa-microchip"></i> ESP32 Sensor Monitoring</h3>
          <p className="card-subtitle">Real-time chiqindi quti monitoring tizimi</p>
        </div>
        <div className="card-actions">
          <button 
            className="btn-secondary" 
            onClick={refreshData}
          >
            <i className="fas fa-sync-alt"></i>
            Yangilash
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Statistika kartlari */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <i className="fas fa-ruler" style={{ fontSize: '2rem', color: '#007bff', marginBottom: '10px' }}></i>
            <h4 style={{ margin: '10px 0', fontSize: '24px' }}>
              {stats.lastReading ? `${stats.lastReading.distance} sm` : 'N/A'}
            </h4>
            <p style={{ margin: '0', color: '#666' }}>Oxirgi o'lchash</p>
            {stats.lastReading && (
              <small style={{ 
                color: getDistanceColor(stats.lastReading.distance),
                fontWeight: '600'
              }}>
                {getDistanceStatus(stats.lastReading.distance)}
              </small>
            )}
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <i className="fas fa-chart-line" style={{ fontSize: '2rem', color: '#28a745', marginBottom: '10px' }}></i>
            <h4 style={{ margin: '10px 0', fontSize: '24px' }}>{stats.totalReadings}</h4>
            <p style={{ margin: '0', color: '#666' }}>Jami o'lchashlar</p>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#ffc107', marginBottom: '10px' }}></i>
            <h4 style={{ margin: '10px 0', fontSize: '24px' }}>{stats.activeAlerts}</h4>
            <p style={{ margin: '0', color: '#666' }}>Faol alertlar</p>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <i className="fas fa-calculator" style={{ fontSize: '2rem', color: '#17a2b8', marginBottom: '10px' }}></i>
            <h4 style={{ margin: '10px 0', fontSize: '24px' }}>{stats.averageDistance} sm</h4>
            <p style={{ margin: '0', color: '#666' }}>O'rtacha masofa</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #ddd', marginBottom: '20px', background: 'white', borderRadius: '8px 8px 0 0' }}>
          <button 
            style={{
              flex: 1,
              padding: '15px 20px',
              background: activeTab === 'realtime' ? '#007bff' : 'transparent',
              color: activeTab === 'realtime' ? 'white' : '#666',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              borderRadius: '8px 0 0 0'
            }}
            onClick={() => setActiveTab('realtime')}
          >
            <i className="fas fa-broadcast-tower"></i> Real-time Ma'lumotlar ({sensorData.length})
          </button>
          <button 
            style={{
              flex: 1,
              padding: '15px 20px',
              background: activeTab === 'alerts' ? '#007bff' : 'transparent',
              color: activeTab === 'alerts' ? 'white' : '#666',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              borderRadius: '0 8px 0 0'
            }}
            onClick={() => setActiveTab('alerts')}
          >
            <i className="fas fa-bell"></i> Alertlar ({alerts.length})
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '0 0 8px 8px', minHeight: '400px' }}>
          {/* Real-time Ma'lumotlar Tab */}
          {activeTab === 'realtime' && (
            <div>
              <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>📡 Oxirgi Sensor Ma'lumotlari</h4>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {sensorData.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>Hech qanday ma'lumot topilmadi</p>
                ) : (
                  sensorData.map(reading => (
                    <div key={reading.id} style={{
                      background: '#f8f9fa',
                      padding: '15px',
                      marginBottom: '10px',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${getDistanceColor(reading.distance)}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                          <strong style={{ fontSize: '18px', color: getDistanceColor(reading.distance) }}>
                            {reading.distance} sm
                          </strong>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: getDistanceColor(reading.distance),
                            color: 'white'
                          }}>
                            {getDistanceStatus(reading.distance)}
                          </span>
                          {reading.isAlert && (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              background: '#dc3545',
                              color: 'white'
                            }}>
                              🚨 ALERT
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          <strong>Sensor ID:</strong> {reading.binId} • 
                          <strong> Joylashuv:</strong> {reading.location}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '12px', color: '#999' }}>
                        {new Date(reading.timestamp).toLocaleString('uz-UZ')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Alertlar Tab */}
          {activeTab === 'alerts' && (
            <div>
              <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>🚨 Sensor Alertlari</h4>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {alerts.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>Hech qanday alert topilmadi</p>
                ) : (
                  alerts.map(alert => (
                    <div key={alert.id} style={{
                      background: alert.status === 'active' ? '#fff3cd' : '#d1ecf1',
                      padding: '15px',
                      marginBottom: '10px',
                      borderRadius: '8px',
                      border: `1px solid ${alert.status === 'active' ? '#ffeaa7' : '#bee5eb'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <i className="fas fa-exclamation-triangle" style={{ color: '#856404' }}></i>
                          <strong style={{ color: '#856404' }}>Alert #{alert.id.slice(-8)}</strong>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            background: alert.status === 'active' ? '#dc3545' : '#28a745',
                            color: 'white'
                          }}>
                            {alert.status === 'active' ? 'FAOL' : 'HAL QILINGAN'}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {new Date(alert.timestamp).toLocaleString('uz-UZ')}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 10px 0', color: '#333' }}>{alert.message}</p>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        <strong>Joylashuv:</strong> {alert.location}
                        {alert.distance && (
                          <>
                            {' • '}
                            <strong>Masofa:</strong> {alert.distance} sm
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sensors
