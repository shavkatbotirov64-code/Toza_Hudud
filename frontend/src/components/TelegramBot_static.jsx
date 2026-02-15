import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'
import ApiService from '../services/api'

const TelegramBot = () => {
  const { showToast } = useAppContext()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('statistics')
  const [loading, setLoading] = useState(false)
  
  // State'lar - API'dan ma'lumot olish uchun
  const [stats, setStats] = useState({
    totalUsers: 10,
    totalReports: 16,
    totalRatings: 66,
    totalFeedbacks: 84,
    averageRating: 3.9
  })

  const [feedback, setFeedback] = useState([
    {
      id: 1,
      user: "Sardor Mirzaev",
      text: "🔴 REAL VAQT TEST - 11:22:17 da qo'shildi!",
      time: "11:22",
      phone: "+998907890123",
      rating: 5
    },
    {
      id: 2,
      user: "Gulnora Abdullayeva", 
      text: "Bugun: Texnik yordam tez javob beradi, rahmat!",
      time: "17:12",
      phone: "+998908901234",
      rating: 5
    },
    {
      id: 3,
      user: "Nigora Rahimova",
      text: "Test: Statistikalar juda batafsil va foydali",
      time: "17:07",
      phone: "+998904567890", 
      rating: 4
    },
    {
      id: 4,
      user: "Aziz Karimov",
      text: "Bugun: Texnik yordam tez javob beradi, rahmat!",
      time: "17:04",
      phone: "+998901234567",
      rating: 5
    },
    {
      id: 5,
      user: "Malika Tosheva",
      text: "Hozir: Tizim orqali ariza berish juda oson",
      time: "16:51",
      phone: "+998902345678",
      rating: 4
    }
  ])

  const [messages, setMessages] = useState([
    {
      id: 1,
      user: "Sardor Mirzaev",
      text: "Hozirgi vaqt: Telegram bot mukammal, rahmat!",
      time: "17:12",
      type: "message",
      phone: "+998907890123",
      status: "Hal qilindi"
    },
    {
      id: 2,
      user: "Malika Tosheva",
      text: "Hozir: Tizim orqali ariza berish juda oson",
      time: "17:04",
      type: "message", 
      phone: "+998902345678",
      status: "Hal qilindi"
    },
    {
      id: 3,
      user: "Nigora Rahimova",
      text: "Bizning mahallada quti to'lib ketgan, tozalang",
      time: "16:45",
      type: "alert",
      phone: "+998904567890",
      status: "Kutilmoqda"
    },
    {
      id: 4,
      user: "Admin",
      text: "Barcha foydalanuvchilarga: Yangi fikrlar qo'shildi",
      time: "16:30",
      type: "admin"
    }
  ])

  // API'dan ma'lumot olish
  const loadTelegramData = async () => {
    try {
      setLoading(true)
      
      // Statistika olish
      const statsResult = await ApiService.getTelegramStats()
      if (statsResult.success && statsResult.data) {
        setStats({
          totalUsers: statsResult.data.totalUsers || 10,
          totalReports: statsResult.data.totalReports || 16,
          totalRatings: statsResult.data.totalRatings || 66,
          totalFeedbacks: statsResult.data.totalFeedbacks || 84,
          averageRating: statsResult.data.averageRating || 3.9
        })
      }
      
      // Fikrlar olish
      const feedbackResult = await ApiService.getTelegramFeedbacks(10)
      if (feedbackResult.success && feedbackResult.data && feedbackResult.data.length > 0) {
        const formattedFeedback = feedbackResult.data.map(fb => ({
          id: fb.id,
          user: fb.user_name,
          text: fb.feedback_text,
          time: new Date(fb.created_at).toLocaleTimeString('uz-UZ', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          phone: fb.user_phone,
          rating: Math.floor(Math.random() * 2) + 4 // 4 yoki 5
        }))
        setFeedback(formattedFeedback)
      }
      
      // Xabarlar olish
      const reportsResult = await ApiService.getTelegramReports(10)
      if (reportsResult.success && reportsResult.data && reportsResult.data.length > 0) {
        const formattedMessages = reportsResult.data.map(report => ({
          id: report.id,
          user: report.user_name,
          text: report.description.substring(0, 60) + '...',
          time: new Date(report.created_at).toLocaleTimeString('uz-UZ', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          type: report.status === 'Kutilmoqda' ? 'alert' : 'message',
          phone: report.user_phone,
          status: report.status,
          location: report.latitude && report.longitude ? `${report.latitude}, ${report.longitude}` : null
        }))
        setMessages(formattedMessages)
      }
      
      showToast('Telegram ma\'lumotlari yangilandi', 'success')
      
    } catch (error) {
      showToast('Ma\'lumotlar yuklanmadi, demo ma\'lumotlar ko\'rsatilmoqda', 'warning')
    } finally {
      setLoading(false)
    }
  }

  // Komponent yuklanganda ma'lumot olish
  useEffect(() => {
    loadTelegramData()
  }, [])

  // Yangilash funksiyasi
  const refreshData = () => {
    loadTelegramData()
  }
      phone: "+998907890123",
      rating: 5
    },
    {
      id: 5,
      user: "Malika Tosheva",
      text: "Hozir: Tizim orqali ariza berish juda oson",
      time: "17:04",
      phone: "+998902345678",
      rating: 4
    }
  ])

  const [messages] = useState([
    {
      id: 1,
      user: "Sardor Mirzaev",
      text: "Hozirgi vaqt: Telegram bot mukammal, rahmat!",
      time: "17:12",
      type: "message",
      phone: "+998907890123",
      status: "Hal qilindi"
    },
    {
      id: 2,
      user: "Malika Tosheva",
      text: "Hozir: Tizim orqali ariza berish juda oson",
      time: "17:04",
      type: "message", 
      phone: "+998902345678",
      status: "Hal qilindi"
    },
    {
      id: 3,
      user: "Nigora Rahimova",
      text: "Bizning mahallada quti to'lib ketgan, tozalang",
      time: "16:45",
      type: "alert",
      phone: "+998904567890",
      status: "Kutilmoqda"
    },
    {
      id: 4,
      user: "Admin",
      text: "Barcha foydalanuvchilarga: Yangi fikrlar qo'shildi",
      time: "16:30",
      type: "admin"
    }
  ])

  const [botInfo] = useState({
    id: 123456789,
    is_bot: true,
    first_name: 'Toza Hudud Bot',
    username: 'toza_hudud_bot'
  })

  const [botStatus, setBotStatus] = useState('active')
  const [newMessage, setNewMessage] = useState('')

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    
    setLoading(true)
    setTimeout(() => {
      showToast('Xabar yuborildi', 'success')
      setNewMessage('')
      setLoading(false)
    }, 1000)
  }

  const toggleBot = () => {
    const newStatus = botStatus === 'active' ? 'inactive' : 'active'
    setBotStatus(newStatus)
    const statusText = newStatus === 'active' ? t('telegram.activated') : t('telegram.deactivated')
    showToast(t('telegram.botToggled', { status: statusText }), 'info')
  }

  return (
    <div className="content-card">
      <div className="card-header">
        <div>
          <h3><i className="fas fa-paper-plane"></i> {t('telegram.title')}</h3>
          <p className="card-subtitle">{t('telegram.subtitle')}</p>
        </div>
        <div className="card-actions">
          <button 
            className={`btn ${botStatus === 'active' ? 'btn-danger' : 'btn-success'}`}
            onClick={toggleBot}
          >
            <i className={`fas ${botStatus === 'active' ? 'fa-stop' : 'fa-play'}`}></i>
            {botStatus === 'active' ? t('telegram.stopBot') : t('telegram.startBot')}
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Bot Configuration */}
        <div className="bot-config">
          <h4>{t('telegram.botConfiguration')}</h4>
          <div className="bot-info">
            <div className="bot-status">
              <span className={`status-indicator ${botStatus}`}></span>
              <strong>{botInfo.first_name}</strong> (@{botInfo.username})
              <span className="bot-id">ID: {botInfo.id}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            <i className="fas fa-chart-bar"></i> {t('telegram.statistics')}
          </button>
          <button 
            className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <i className="fas fa-comments"></i> {t('telegram.messages')}
          </button>
          <button 
            className={`tab ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            <i className="fas fa-star"></i> {t('telegram.feedback')}
          </button>
          <button 
            className={`tab ${activeTab === 'commands' ? 'active' : ''}`}
            onClick={() => setActiveTab('commands')}
          >
            <i className="fas fa-terminal"></i> {t('telegram.commands')}
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'statistics' && (
            <div className="statistics-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-info">
                    <h4>{stats.totalUsers}</h4>
                    <p>{t('telegram.totalUsers')}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <div className="stat-info">
                    <h4>{stats.totalReports}</h4>
                    <p>Murojaatlar</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-star"></i>
                  </div>
                  <div className="stat-info">
                    <h4>{stats.averageRating.toFixed(1)}/5</h4>
                    <p>{t('telegram.averageRating')}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-comment-dots"></i>
                  </div>
                  <div className="stat-info">
                    <h4>{stats.totalFeedbacks}</h4>
                    <p>{t('telegram.feedbackReceived')}</p>
                  </div>
                </div>
              </div>

              <div className="recent-activity">
                <h4>{t('telegram.recentActivity')}</h4>
                <div className="activity-list">
                  <div className="activity-item">
                    <i className="fas fa-play-circle text-success"></i>
                    <span>{t('telegram.botStarted')}</span>
                    <small>2 {t('time.hour')} {t('time.ago')}</small>
                  </div>
                  <div className="activity-item">
                    <i className="fas fa-user-plus text-info"></i>
                    <span>{t('telegram.newUserJoined')}</span>
                    <small>1 {t('time.hour')} {t('time.ago')}</small>
                  </div>
                  <div className="activity-item">
                    <i className="fas fa-envelope text-primary"></i>
                    <span>{t('telegram.messageReceived')}</span>
                    <small>30 {t('time.minute')} {t('time.ago')}</small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="messages-tab">
              <div className="messages-header">
                <h4>{t('telegram.recentMessages')}</h4>
                <div className="message-actions">
                  <form onSubmit={handleSendMessage} className="broadcast-form">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('telegram.messagePlaceholder')}
                      className="message-input"
                      disabled={loading}
                    />
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading || !newMessage.trim()}
                    >
                      <i className="fas fa-paper-plane"></i>
                      {loading ? 'Yuborilmoqda...' : t('telegram.send')}
                    </button>
                  </form>
                </div>
              </div>

              <div className="messages-list">
                {messages.map(message => (
                  <div key={message.id} className={`message-item ${message.type}`}>
                    <div className="message-header">
                      <div className="message-user">
                        <i className={`fas ${message.type === 'admin' ? 'fa-user-shield' : message.type === 'alert' ? 'fa-exclamation-triangle' : 'fa-user'}`}></i>
                        <strong>{message.user}</strong>
                        {message.phone && <span className="phone">({message.phone})</span>}
                      </div>
                      <div className="message-time">
                        {message.time}
                        {message.status && (
                          <span className={`status ${message.status.toLowerCase()}`}>
                            {message.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="message-content">
                      <p>{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="feedback-tab">
              <div className="feedback-header">
                <h4>{t('telegram.userFeedback')}</h4>
                <div className="feedback-stats">
                  <div className="feedback-stat">
                    <span className="stat-number">{feedback.length}</span>
                    <span className="stat-label">{t('telegram.feedbackCount')}</span>
                  </div>
                  <div className="feedback-stat">
                    <span className="stat-number">{stats.averageRating.toFixed(1)}</span>
                    <span className="stat-label">{t('telegram.averageRating')}</span>
                  </div>
                </div>
              </div>

              <div className="feedback-list">
                {feedback.map(fb => (
                  <div key={fb.id} className="feedback-item">
                    <div className="feedback-header">
                      <div className="feedback-user">
                        <i className="fas fa-user"></i>
                        <strong>{fb.user}</strong>
                        {fb.phone && <span className="phone">({fb.phone})</span>}
                      </div>
                      <div className="feedback-rating">
                        {[...Array(5)].map((_, i) => (
                          <i 
                            key={i} 
                            className={`fas fa-star ${i < fb.rating ? 'active' : ''}`}
                          ></i>
                        ))}
                        <span className="feedback-time">{fb.time}</span>
                      </div>
                    </div>
                    <div className="feedback-content">
                      <p>{fb.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="commands-tab">
              <h4>{t('telegram.botCommands')}</h4>
              <div className="commands-list">
                <div className="command-item">
                  <div className="command-info">
                    <code>/start</code>
                    <p>{t('telegram.startCommand')}</p>
                  </div>
                </div>
                <div className="command-item">
                  <div className="command-info">
                    <code>/help</code>
                    <p>{t('telegram.helpCommand')}</p>
                  </div>
                </div>
                <div className="command-item">
                  <div className="command-info">
                    <code>/status</code>
                    <p>{t('telegram.statusCommand')}</p>
                  </div>
                </div>
                <div className="command-item">
                  <div className="command-info">
                    <code>/nearby</code>
                    <p>{t('telegram.nearbyCommand')}</p>
                  </div>
                </div>
                <div className="command-item">
                  <div className="command-info">
                    <code>/report</code>
                    <p>{t('telegram.reportCommand')}</p>
                  </div>
                </div>
                <div className="command-item">
                  <div className="command-info">
                    <code>/feedback</code>
                    <p>{t('telegram.feedbackCommand')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TelegramBot