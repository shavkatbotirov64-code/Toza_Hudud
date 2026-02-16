import React from 'react'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'

const ActivityFeed = () => {
  const { activityData, showToast, refreshData } = useAppContext()
  const { t } = useTranslation()
  const [refreshing, setRefreshing] = React.useState(false)

  const loadActivity = async () => {
    setRefreshing(true)
    try {
      await refreshData() // API dan yangilash
      showToast(t('dashboard.activityRefreshed'), 'success')
    } catch (error) {
      showToast('Faoliyatlarni yangilashda xatolik', 'error')
    } finally {
      setTimeout(() => setRefreshing(false), 800)
    }
  }

  const getActivityTitle = (activity) => {
    // Translate activity titles based on type and content
    if (activity.title.includes('to\'ldi')) {
      return t('activity.binFull').replace('{binId}', activity.binId || 'BIN-001')
    } else if (activity.title.includes('yetib keldi')) {
      return t('activity.vehicleArrived').replace('{vehicleId}', activity.vehicleId || 'VH-001')
    } else if (activity.title.includes('Yangi quti')) {
      return t('activity.newBinAdded')
    } else if (activity.title.includes('ogohlantirish')) {
      return t('activity.binWarning').replace('{binId}', activity.binId || 'BIN-008')
    } else if (activity.title.includes('Sensor nosozligi')) {
      return t('activity.sensorMalfunction')
    }
    return activity.title
  }

  const getActivityDescription = (activity) => {
    // Translate activity descriptions
    if (activity.description.includes('95% to\'ldi')) {
      return t('activity.binFullDesc')
    } else if (activity.description.includes('tozalandi')) {
      return t('activity.binCleanedDesc').replace('{binId}', activity.binId || 'BIN-001')
    } else if (activity.description.includes('aktivlashtirildi')) {
      return t('activity.binActivatedDesc').replace('{binId}', activity.binId || 'BIN-011')
    } else if (activity.description.includes('85% to\'ldi')) {
      return t('activity.binWarningDesc')
    } else if (activity.description.includes('ishlamayapti')) {
      return t('activity.sensorNotWorkingDesc').replace('{binId}', activity.binId || 'BIN-005')
    }
    return activity.description
  }

  return (
    <div className="content-card activity-card">
      <div className="card-header">
        <h3><i className="fas fa-history"></i> {t('dashboard.recentActivity')}</h3>
        <button className="btn-icon" onClick={loadActivity} disabled={refreshing}>
          <i className={`fas fa-${refreshing ? 'spinner fa-spin' : 'sync-alt'}`}></i>
        </button>
      </div>
      <div className="card-body">
        <div className="activity-list">
          {activityData.slice(0, 5).map((activity, index) => (
            <div key={activity.id} className={`activity-item ${activity.type}`}>
              <div className="activity-header">
                <div className="activity-title">{getActivityTitle(activity)}</div>
                <div className="activity-time">{activity.time}</div>
              </div>
              <div className="activity-desc">{getActivityDescription(activity)}</div>
              <div className="activity-meta">
                <span><i className="fas fa-map-marker-alt"></i> {activity.location}</span>
                <span><i className="fas fa-clock"></i> {activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ActivityFeed

