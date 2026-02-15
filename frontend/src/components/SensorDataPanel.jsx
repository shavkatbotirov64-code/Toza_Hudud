import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/SensorDataPanel.css';

const SensorDataPanel = () => {
  const [sensorData, setSensorData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSensorData();
    const interval = setInterval(loadSensorData, 5000); // Har 5 sekundda yangilash
    return () => clearInterval(interval);
  }, []);

  const loadSensorData = async () => {
    try {
      console.log('🔄 Loading sensor data...');
      const [dataResult, statsResult] = await Promise.all([
        api.getSensorData(10),
        api.getSensorStats()
      ]);

      console.log('📊 Data result:', dataResult);
      console.log('📈 Stats result:', statsResult);

      if (dataResult.success) {
        console.log('✅ Setting sensor data:', dataResult.data);
        setSensorData(dataResult.data);
      } else {
        console.error('❌ Data result failed:', dataResult);
      }

      if (statsResult.success) {
        console.log('✅ Setting stats:', statsResult.data);
        setStats(statsResult.data);
      } else {
        console.error('❌ Stats result failed:', statsResult);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Sensor ma\'lumotlarini yuklashda xatolik:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (distance) => {
    if (distance <= 10) return '#ef4444'; // Qizil - to'la
    if (distance <= 20) return '#f59e0b'; // Sariq - ogohlantirish
    return '#10b981'; // Yashil - normal
  };

  const getStatusText = (distance) => {
    if (distance <= 10) return 'TO\'LA';
    if (distance <= 20) return 'OGOHLANTIRISH';
    return 'NORMAL';
  };

  if (loading) {
    return (
      <div className="sensor-panel">
        <div className="sensor-header">
          <h3>📡 ESP32 Sensor Ma'lumotlari</h3>
        </div>
        <div className="loading">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="sensor-panel">
      <div className="sensor-header">
        <h3>📡 ESP32 Sensor Ma'lumotlari</h3>
        <button onClick={loadSensorData} className="refresh-btn">
          🔄 Yangilash
        </button>
      </div>

      {/* Statistika */}
      <div className="sensor-stats">
        <div className="stat-card">
          <div className="stat-label">Jami o'lchashlar</div>
          <div className="stat-value">{stats.totalReadings || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Jami ogohlantirishlar</div>
          <div className="stat-value alert">{stats.totalAlerts || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">O'rtacha masofa</div>
          <div className="stat-value">{stats.averageDistance ? `${stats.averageDistance.toFixed(1)} sm` : 'N/A'}</div>
        </div>
      </div>

      {/* Sensor ma'lumotlari */}
      <div className="sensor-data-list">
        {sensorData.length === 0 ? (
          <div className="no-data">
            <p>Hozircha sensor ma'lumotlari yo'q</p>
            <p className="hint">ESP32 qurilmangiz ma'lumot yuborishini kuting...</p>
          </div>
        ) : (
          <table className="sensor-table">
            <thead>
              <tr>
                <th>Vaqt</th>
                <th>Masofa (sm)</th>
                <th>Holat</th>
                <th>Quti ID</th>
                <th>Joylashuv</th>
              </tr>
            </thead>
            <tbody>
              {sensorData.map((item, index) => (
                <tr key={index}>
                  <td>{formatDate(item.timestamp)}</td>
                  <td className="distance-cell">
                    <span 
                      className="distance-badge"
                      style={{ backgroundColor: getStatusColor(item.distance) }}
                    >
                      {item.distance} sm
                    </span>
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ color: getStatusColor(item.distance) }}
                    >
                      {getStatusText(item.distance)}
                    </span>
                  </td>
                  <td>{item.binId || 'N/A'}</td>
                  <td>{item.location || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SensorDataPanel;
