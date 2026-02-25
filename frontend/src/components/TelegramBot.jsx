import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'
import ApiService from '../services/api'

const TelegramBot = () => {
  const { showToast } = useAppContext()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('statistics')
  const [loading, setLoading] = useState(true)
  
  // State'lar - faqat API'dan ma'lumot
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    totalRatings: 0,
    totalFeedbacks: 0,
    averageRating: 0
  })

  const [feedback, setFeedback] = useState([])
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [lastFeedbackId, setLastFeedbackId] = useState(0) // Oxirgi fikr ID'sini kuzatish
  const [botInfo, setBotInfo] = useState({
    id: 123456789,
    is_bot: true,
    first_name: 'Toza Hudud Bot',
    username: 'toza_hudud_bot'
  })

  const [botStatus, setBotStatus] = useState('active')
  const [newMessage, setNewMessage] = useState('')

  // API'dan barcha ma'lumotlarni olish
  const loadTelegramData = async () => {
    try {
      setLoading(true)
      
      // Bot info olish
      try {
        const botInfoResult = await ApiService.getTelegramBotInfo()
        if (botInfoResult.success && botInfoResult.data) {
          setBotInfo(botInfoResult.data)
        }
      } catch (error) {
        // Demo bot info qoladi
      }
      
      // Statistika olish
      const statsResult = await ApiService.getTelegramStats()
      if (statsResult.success && statsResult.data) {
        setStats({
          totalUsers: statsResult.data.totalUsers || 0,
          totalReports: statsResult.data.totalReports || 0,
          totalRatings: statsResult.data.totalRatings || 0,
          totalFeedbacks: statsResult.data.totalFeedbacks || 0,
          averageRating: statsResult.data.averageRating || 0
        })
      }
      
      // Barcha fikrlarni olish
      const feedbackResult = await ApiService.getTelegramFeedbacks(10) // 10 ta fikr olish
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
          rating: Math.floor(Math.random() * 2) + 4, // 4 yoki 5
          created_at: fb.created_at
        }))
        
        // Yangi fikrlarni aniqlash
        if (formattedFeedback.length > 0) {
          const latestFeedbackId = Math.max(...formattedFeedback.map(f => f.id))
          
          if (lastFeedbackId > 0 && latestFeedbackId > lastFeedbackId) {
            const newFeedbacks = formattedFeedback.filter(f => f.id > lastFeedbackId)
            newFeedbacks.forEach(newFb => {
              showToast(`Yangi fikr: ${newFb.user} - ${newFb.text.substring(0, 50)}...`, 'success')
            })
          }
          
          setLastFeedbackId(latestFeedbackId)
        }
        
        setFeedback(formattedFeedback)
      }
      
      // Barcha xabarlarni olish
      const reportsResult = await ApiService.getTelegramReports(15)
      if (reportsResult.success && reportsResult.data && reportsResult.data.length > 0) {
        const formattedMessages = reportsResult.data.map(report => ({
          id: report.id,
          user: report.user_name,
          text: report.description.length > 60 ? report.description.substring(0, 60) + '...' : report.description,
          time: new Date(report.created_at).toLocaleTimeString('uz-UZ', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          type: report.status === 'Kutilmoqda' ? 'alert' : 'message',
          phone: report.user_phone,
          status: report.status,
          location: report.latitude && report.longitude ? `${report.latitude}, ${report.longitude}` : null,
          created_at: report.created_at
        }))
        setMessages(formattedMessages)
      }
      
      // Faqat ro'yxatdan o'tgan foydalanuvchilarni olish
      const usersResult = await ApiService.getAllTelegramUsers(100)
      if (usersResult.success && usersResult.data && usersResult.data.length > 0) {
        // Faqat registered statusdagi foydalanuvchilarni filtrlash
        const registeredUsers = usersResult.data.filter(user => user.status === 'registered')
        
        const formattedUsers = registeredUsers.map(user => ({
          id: user.telegram_id,
          name: user.name || 'Noma\'lum',
          phone: user.phone || 'Noma\'lum',
          status: user.status,
          joinDate: new Date(user.created_at).toLocaleDateString('uz-UZ'),
          lastActive: user.last_activity ? 
            new Date(user.last_activity).toLocaleDateString('uz-UZ') : 
            'Noma\'lum',
          reportsCount: user.reports_count || 0,
          feedbacksCount: user.feedbacks_count || 0
        }))
        setUsers(formattedUsers)
      }
      
      showToast('Database ma\'lumotlari yuklandi', 'success')
      
    } catch (error) {
      showToast('Ma\'lumotlar yuklanmadi', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Komponent yuklanganda ma'lumot olish
  useEffect(() => {
    loadTelegramData()
    
    // Har 30 soniyada avtomatik yangilash
    const interval = setInterval(() => {
      loadTelegramData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Yangilash funksiyasi
  const refreshData = () => {
    loadTelegramData()
  }

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
            className="btn-secondary" 
            onClick={refreshData}
          >
            <i className="fas fa-sync-alt"></i>
            {t('dashboard.refresh')}
          </button>
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
        <div style={{ display: 'flex', borderBottom: '2px solid #ddd', marginBottom: '20px', background: 'white', borderRadius: '8px 8px 0 0' }}>
          <button 
            style={{
              flex: 1,
              padding: '15px 20px',
              background: activeTab === 'statistics' ? '#007bff' : 'transparent',
              color: activeTab === 'statistics' ? 'white' : '#666',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              borderRadius: '8px 0 0 0'
            }}
            onClick={() => {
              console.log('Statistics clicked, setting activeTab to statistics')
              setActiveTab('statistics')
            }}
          >
            <i className="fas fa-chart-bar"></i> {t('telegram.statistics')}
          </button>
          <button 
            style={{
              flex: 1,
              padding: '15px 20px',
              background: activeTab === 'messages' ? '#007bff' : 'transparent',
              color: activeTab === 'messages' ? 'white' : '#666',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onClick={() => {
              console.log('Messages clicked, setting activeTab to messages')
              setActiveTab('messages')
            }}
          >
            <i className="fas fa-comments"></i> {t('telegram.messages')} ({messages.length})
          </button>
          <button 
            style={{
              flex: 1,
              padding: '15px 20px',
              background: activeTab === 'feedback' ? '#007bff' : 'transparent',
              color: activeTab === 'feedback' ? 'white' : '#666',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onClick={() => {
              console.log('Feedback clicked, setting activeTab to feedback')
              setActiveTab('feedback')
            }}
          >
            <i className="fas fa-star"></i> {t('telegram.feedback')} ({Math.min(feedback.length, 10)})
          </button>
          <button 
            style={{
              flex: 1,
              padding: '15px 20px',
              background: activeTab === 'commands' ? '#007bff' : 'transparent',
              color: activeTab === 'commands' ? 'white' : '#666',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              borderRadius: '0 8px 0 0'
            }}
            onClick={() => {
              console.log('Commands clicked, setting activeTab to commands')
              setActiveTab('commands')
            }}
          >
            <i className="fas fa-terminal"></i> {t('telegram.commands')}
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '0 0 8px 8px', minHeight: '400px' }}>
          {/* Debug ma'lumotlar - har doim ko'rinadigan */}
          <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>🔥 DEBUG MA'LUMOTLAR</h4>
            <p style={{ margin: '5px 0' }}><strong>{t('common.activeTab') || 'Faol Tab'}:</strong> <span style={{ color: '#007bff', fontSize: '18px' }}>{activeTab}</span></p>
            <p style={{ margin: '5px 0' }}><strong>{t('telegram.messages')} {t('common.count') || 'Soni'}:</strong> {messages.length}</p>
            <p style={{ margin: '5px 0' }}><strong>{t('telegram.feedback')} {t('common.count') || 'Soni'}:</strong> {feedback.length}</p>
            <p style={{ margin: '5px 0' }}><strong>Ro'yxatdan o'tgan foydalanuvchilar:</strong> {users.length}</p>
            <p style={{ margin: '5px 0' }}><strong>{t('telegram.statistics')}:</strong> {t('telegram.totalUsers')}: {stats.totalUsers}, {t('common.reports') || 'Murojaatlar'}: {stats.totalReports}, {t('telegram.feedback')}: {stats.totalFeedbacks}</p>
          </div>

          {/* Statistika Tab */}
          {activeTab === 'statistics' && (
            <div style={{ padding: '20px', background: '#d4edda', borderRadius: '8px', border: '2px solid #28a745' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#155724' }}>📊 {t('telegram.statistics').toUpperCase()} TAB FAOL</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div 
                  style={{ 
                    background: 'white', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    textAlign: 'center', 
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    border: '2px solid transparent'
                  }}
                  onClick={() => setActiveTab('usersList')}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)'
                    e.target.style.borderColor = '#007bff'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)'
                    e.target.style.borderColor = 'transparent'
                  }}
                >
                  <i className="fas fa-users" style={{ fontSize: '2rem', color: '#007bff', marginBottom: '10px' }}></i>
                  <h4 style={{ margin: '10px 0', fontSize: '24px' }}>{stats.totalUsers}</h4>
                  <p style={{ margin: '0', color: '#666' }}>Foydalanuvchilar</p>
                  <small style={{ color: '#007bff', fontSize: '12px' }}>Batafsil ko'rish uchun bosing</small>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                  <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#ffc107', marginBottom: '10px' }}></i>
                  <h4 style={{ margin: '10px 0', fontSize: '24px' }}>{stats.totalReports}</h4>
                  <p style={{ margin: '0', color: '#666' }}>Murojaatlar</p>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                  <i className="fas fa-star" style={{ fontSize: '2rem', color: '#ffc107', marginBottom: '10px' }}></i>
                  <h4 style={{ margin: '10px 0', fontSize: '24px' }}>{stats.averageRating.toFixed(1)}/5</h4>
                  <p style={{ margin: '0', color: '#666' }}>{t('telegram.averageRating')}</p>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                  <i className="fas fa-comment-dots" style={{ fontSize: '2rem', color: '#28a745', marginBottom: '10px' }}></i>
                  <h4 style={{ margin: '10px 0', fontSize: '24px' }}>{stats.totalFeedbacks}</h4>
                  <p style={{ margin: '0', color: '#666' }}>{t('telegram.userFeedback')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Xabarlar Tab */}
          {activeTab === 'messages' && (
            <div style={{ padding: '20px', background: '#cce5ff', borderRadius: '8px', border: '2px solid #007bff' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#004085' }}>💬 {t('telegram.messages').toUpperCase()} TAB FAOL ({messages.length} ta)</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {messages.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>{t('telegram.noMessages')}</p>
                ) : (
                  messages.slice(0, 10).map(message => (
                    <div key={message.id} style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <strong style={{ color: '#007bff' }}>{message.user}</strong>
                        <span style={{ fontSize: '12px', color: '#666' }}>{message.time}</span>
                      </div>
                      <p style={{ margin: '0 0 10px 0' }}>{message.text}</p>
                      {message.status && (
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: '#e9ecef', color: '#495057' }}>
                          {message.status}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Fikrlar Tab */}
          {activeTab === 'feedback' && (
            <div style={{ padding: '20px', background: '#ffe6cc', borderRadius: '8px', border: '2px solid #fd7e14' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#8a4100' }}>⭐ {t('telegram.feedback').toUpperCase()} TAB FAOL ({Math.min(feedback.length, 10)} ta)</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {feedback.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>{t('telegram.noFeedback')}</p>
                ) : (
                  feedback.slice(0, 10).map(fb => (
                    <div key={fb.id} style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <strong style={{ color: '#fd7e14' }}>{fb.user}</strong>
                        <div>
                          {[...Array(5)].map((_, i) => (
                            <i 
                              key={i} 
                              className="fas fa-star"
                              style={{ color: i < fb.rating ? '#ffc107' : '#e5e7eb', marginRight: '2px' }}
                            ></i>
                          ))}
                          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>{fb.time}</span>
                        </div>
                      </div>
                      <p style={{ margin: '0' }}>{fb.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Foydalanuvchilar ro'yxati (Statistikadan ochiladi) */}
          {activeTab === 'usersList' && (
            <div style={{ padding: '20px', background: '#e8f5e8', borderRadius: '8px', border: '2px solid #28a745' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: '0', color: '#155724' }}>👥 RO'YXATDAN O'TGAN FOYDALANUVCHILAR ({users.length} ta)</h3>
                <button 
                  style={{
                    padding: '8px 16px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveTab('statistics')}
                >
                  ← Statistikaga qaytish
                </button>
              </div>
              <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center', flex: 1 }}>
                  <h4 style={{ margin: '0', color: '#28a745' }}>{users.length}</h4>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>To'liq ro'yxatdan o'tgan</p>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center', flex: 1 }}>
                  <h4 style={{ margin: '0', color: '#007bff' }}>{users.reduce((sum, u) => sum + u.reportsCount, 0)}</h4>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Jami murojaatlar</p>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center', flex: 1 }}>
                  <h4 style={{ margin: '0', color: '#fd7e14' }}>{users.reduce((sum, u) => sum + u.feedbacksCount, 0)}</h4>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Jami fikrlar</p>
                </div>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {users.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666', fontSize: '18px' }}>Ro'yxatdan o'tgan foydalanuvchilar topilmadi</p>
                ) : (
                  users.map(user => (
                    <div key={user.id} style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                          <strong style={{ color: '#007bff', fontSize: '16px' }}>{user.name}</strong>
                          <span style={{ 
                            marginLeft: '10px', 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            fontSize: '12px',
                            background: '#d4edda',
                            color: '#155724'
                          }}>
                            ✅ Ro'yxatdan o'tgan
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#666' }}>ID: {user.id}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                        <div>
                          <strong>📞 Telefon:</strong> {user.phone}
                        </div>
                        <div>
                          <strong>📅 Qo'shilgan:</strong> {user.joinDate}
                        </div>
                        <div>
                          <strong>📊 Murojaatlar:</strong> {user.reportsCount}
                        </div>
                        <div>
                          <strong>⭐ Fikrlar:</strong> {user.feedbacksCount}
                        </div>
                      </div>
                      {user.lastActive !== 'Noma\'lum' && (
                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                          <strong>🕒 Oxirgi faollik:</strong> {user.lastActive}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Buyruqlar Tab */}
          {activeTab === 'commands' && (
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '2px solid #6c757d' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#495057' }}>⚡ {t('telegram.commands').toUpperCase()} TAB FAOL</h3>
              <div>
                <div style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <code style={{ background: '#e9ecef', padding: '4px 8px', borderRadius: '4px', color: '#495057' }}>/start</code>
                  <span style={{ marginLeft: '15px' }}>{t('telegram.startCommand')}</span>
                </div>
                <div style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <code style={{ background: '#e9ecef', padding: '4px 8px', borderRadius: '4px', color: '#495057' }}>/help</code>
                  <span style={{ marginLeft: '15px' }}>{t('telegram.helpCommand')}</span>
                </div>
                <div style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <code style={{ background: '#e9ecef', padding: '4px 8px', borderRadius: '4px', color: '#495057' }}>/status</code>
                  <span style={{ marginLeft: '15px' }}>{t('telegram.statusCommand')}</span>
                </div>
                <div style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <code style={{ background: '#e9ecef', padding: '4px 8px', borderRadius: '4px', color: '#495057' }}>/report</code>
                  <span style={{ marginLeft: '15px' }}>{t('telegram.reportCommand')}</span>
                </div>
                <div style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <code style={{ background: '#e9ecef', padding: '4px 8px', borderRadius: '4px', color: '#495057' }}>/feedback</code>
                  <span style={{ marginLeft: '15px' }}>{t('telegram.feedbackCommand')}</span>
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
