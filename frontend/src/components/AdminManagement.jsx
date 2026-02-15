import React, { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'

const AdminManagement = ({ currentAdmin }) => {
  const { showToast } = useAppContext()
  const [activeTab, setActiveTab] = useState('admins')
  const [loading, setLoading] = useState(false)
  const [admins, setAdmins] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin'
  })

  // API so'rovlari uchun token olish
  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken')
    
    if (!token) {
      showToast('Tizimga qayta kiring', 'error')
      // Token yo'q bo'lsa, logout qilish
      setTimeout(() => {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminData')
        window.location.reload()
      }, 1000)
      return null
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  // Token test qilish
  const testToken = async () => {
    try {
      const headers = getAuthHeaders()
      if (!headers) return false
      
      const response = await fetch('http://localhost:3002/api/auth/test-token', {
        headers
      })
      
      const data = await response.json()
      
      if (data.success) {
        return true
      } else {
        return false
      }
    } catch (error) {
      return false
    }
  }

  // Adminlarni yuklash
  const loadAdmins = async () => {
    try {
      setLoading(true)
      const headers = getAuthHeaders()
      if (!headers) return // Token yo'q bo'lsa, chiqish
      
      const response = await fetch('http://localhost:3002/api/auth/admins', {
        headers
      })
      
      const data = await response.json()
      if (data.success) {
        setAdmins(data.data)
      } else {
        showToast('Adminlarni yuklashda xatolik', 'error')
      }
    } catch (error) {
      console.error('Load admins error:', error)
      showToast('Server bilan bog\'lanishda xatolik', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Faoliyat loglarini yuklash
  const loadActivityLogs = async () => {
    try {
      setLoading(true)
      const headers = getAuthHeaders()
      if (!headers) return // Token yo'q bo'lsa, chiqish
      
      const response = await fetch('http://localhost:3002/api/auth/activity-logs?limit=50', {
        headers
      })
      
      const data = await response.json()
      if (data.success) {
        setActivityLogs(data.data)
      } else {
        showToast('Loglarni yuklashda xatolik', 'error')
      }
    } catch (error) {
      console.error('Load logs error:', error)
      showToast('Server bilan bog\'lanishda xatolik', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Yangi admin yaratish
  const createAdmin = async (e) => {
    e.preventDefault()
    
    if (!newAdmin.username || !newAdmin.email || !newAdmin.password) {
      showToast('Barcha maydonlarni to\'ldiring', 'error')
      return
    }

    try {
      setLoading(true)
      const headers = getAuthHeaders()
      if (!headers) return // Token yo'q bo'lsa, chiqish
      
      const response = await fetch('http://localhost:3002/api/auth/admins', {
        method: 'POST',
        headers,
        body: JSON.stringify(newAdmin)
      })
      
      const data = await response.json()
      if (data.success) {
        showToast('Admin muvaffaqiyatli yaratildi', 'success')
        setShowCreateModal(false)
        setNewAdmin({ username: '', email: '', password: '', role: 'admin' })
        loadAdmins()
      } else {
        showToast(data.message || 'Admin yaratishda xatolik', 'error')
      }
    } catch (error) {
      console.error('Create admin error:', error)
      showToast('Server bilan bog\'lanishda xatolik', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Admin o'chirish
  const deleteAdmin = async (adminId, adminUsername) => {
    if (!confirm(`${adminUsername} adminni o'chirishni tasdiqlaysizmi?`)) {
      return
    }

    try {
      setLoading(true)
      const headers = getAuthHeaders()
      if (!headers) return // Token yo'q bo'lsa, chiqish
      
      const response = await fetch(`http://localhost:3002/api/auth/admins/${adminId}`, {
        method: 'DELETE',
        headers
      })
      
      const data = await response.json()
      if (data.success) {
        showToast('Admin muvaffaqiyatli o\'chirildi', 'success')
        loadAdmins()
      } else {
        showToast(data.message || 'Admin o\'chirishda xatolik', 'error')
      }
    } catch (error) {
      console.error('Delete admin error:', error)
      showToast('Server bilan bog\'lanishda xatolik', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Admin holatini o'zgartirish
  const toggleAdminStatus = async (adminId, adminUsername) => {
    try {
      setLoading(true)
      const headers = getAuthHeaders()
      if (!headers) return // Token yo'q bo'lsa, chiqish
      
      const response = await fetch(`http://localhost:3002/api/auth/admins/${adminId}/toggle-status`, {
        method: 'PATCH',
        headers
      })
      
      const data = await response.json()
      if (data.success) {
        showToast(`${adminUsername} holati o'zgartirildi`, 'success')
        loadAdmins()
      } else {
        showToast(data.message || 'Holat o\'zgartirishda xatolik', 'error')
      }
    } catch (error) {
      console.error('Toggle status error:', error)
      showToast('Server bilan bog\'lanishda xatolik', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'admins') {
      // Avval token test qilish
      testToken().then(isValid => {
        if (isValid) {
          loadAdmins()
        }
      })
    } else if (activeTab === 'logs') {
      testToken().then(isValid => {
        if (isValid) {
          loadActivityLogs()
        }
      })
    }
  }, [activeTab])

  // Faqat Super Admin ko'ra oladi
  if (currentAdmin.role !== 'super_admin') {
    return (
      <div className="content-card">
        <div className="card-header">
          <h3><i className="fas fa-lock"></i> Ruxsat yo'q</h3>
        </div>
        <div className="card-body">
          <p>Bu bo'limni faqat Super Admin ko'ra oladi.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-card">
      <div className="card-header">
        <div>
          <h3><i className="fas fa-users-cog"></i> Admin Boshqaruvi</h3>
          <p className="card-subtitle">Adminlar va faoliyat loglarini boshqarish</p>
        </div>
        <div className="card-actions">
          {activeTab === 'admins' && (
            <button 
              className="btn-primary" 
              onClick={() => setShowCreateModal(true)}
              disabled={loading}
            >
              <i className="fas fa-plus"></i>
              Yangi Admin
            </button>
          )}
        </div>
      </div>

      <div className="card-body">
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #ddd', marginBottom: '20px', background: 'white', borderRadius: '8px 8px 0 0' }}>
          <button 
            style={{
              flex: 1,
              padding: '15px 20px',
              background: activeTab === 'admins' ? '#007bff' : 'transparent',
              color: activeTab === 'admins' ? 'white' : '#666',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              borderRadius: '8px 0 0 0'
            }}
            onClick={() => setActiveTab('admins')}
          >
            <i className="fas fa-users"></i> Adminlar ({admins.length})
          </button>
          <button 
            style={{
              flex: 1,
              padding: '15px 20px',
              background: activeTab === 'logs' ? '#007bff' : 'transparent',
              color: activeTab === 'logs' ? 'white' : '#666',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              borderRadius: '0 8px 0 0'
            }}
            onClick={() => setActiveTab('logs')}
          >
            <i className="fas fa-history"></i> Faoliyat Loglari ({activityLogs.length})
          </button>
        </div>

        {/* Adminlar Tab */}
        {activeTab === 'admins' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#007bff' }}></i>
                <p>Yuklanmoqda...</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {admins.map(admin => (
                  <div key={admin.id} style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: admin.role === 'super_admin' ? '2px solid #ffc107' : '1px solid #e1e5e9'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                          {admin.username}
                          {admin.role === 'super_admin' && (
                            <span style={{
                              marginLeft: '10px',
                              padding: '2px 8px',
                              background: '#ffc107',
                              color: '#000',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              SUPER ADMIN
                            </span>
                          )}
                          {!admin.isActive && (
                            <span style={{
                              marginLeft: '10px',
                              padding: '2px 8px',
                              background: '#dc3545',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '12px'
                            }}>
                              NOFAOL
                            </span>
                          )}
                        </h4>
                        <p style={{ margin: '0', color: '#666' }}>{admin.email}</p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#999' }}>
                          Yaratilgan: {new Date(admin.createdAt).toLocaleDateString('uz-UZ')}
                          {admin.lastLogin && (
                            <span> • Oxirgi kirish: {new Date(admin.lastLogin).toLocaleString('uz-UZ')}</span>
                          )}
                        </p>
                      </div>
                      
                      {admin.role !== 'super_admin' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => toggleAdminStatus(admin.id, admin.username)}
                            disabled={loading}
                            style={{
                              padding: '8px 12px',
                              background: admin.isActive ? '#ffc107' : '#28a745',
                              color: admin.isActive ? '#000' : 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            <i className={`fas ${admin.isActive ? 'fa-pause' : 'fa-play'}`}></i>
                            {admin.isActive ? 'Faolsizlashtirish' : 'Faollashtirish'}
                          </button>
                          <button
                            onClick={() => deleteAdmin(admin.id, admin.username)}
                            disabled={loading}
                            style={{
                              padding: '8px 12px',
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            <i className="fas fa-trash"></i>
                            O'chirish
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Faoliyat Loglari Tab */}
        {activeTab === 'logs' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#007bff' }}></i>
                <p>Yuklanmoqda...</p>
              </div>
            ) : (
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {activityLogs.map(log => (
                  <div key={log.id} style={{
                    background: 'white',
                    padding: '15px',
                    marginBottom: '10px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderLeft: `4px solid ${getActionColor(log.action)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ color: '#333' }}>{log.adminUsername}</strong>
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(log.timestamp).toLocaleString('uz-UZ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        padding: '2px 8px',
                        background: getActionColor(log.action),
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {getActionText(log.action)}
                      </span>
                      <span style={{ color: '#666' }}>{log.details}</span>
                    </div>
                    {log.ipAddress && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                        IP: {log.ipAddress}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Yangi Admin Yaratish Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Yangi Admin Yaratish</h3>
            
            <form onSubmit={createAdmin}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                  placeholder="Username kiriting"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  placeholder="Email kiriting"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Parol
                </label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  placeholder="Parol kiriting (kamida 6 ta belgi)"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Rol
                </label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    background: loading ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Yaratilmoqda...' : 'Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Yordamchi funksiyalar
const getActionColor = (action) => {
  switch (action) {
    case 'LOGIN': return '#28a745'
    case 'LOGOUT': return '#6c757d'
    case 'CREATE_ADMIN': return '#007bff'
    case 'DELETE_ADMIN': return '#dc3545'
    case 'TOGGLE_ADMIN_STATUS': return '#ffc107'
    default: return '#17a2b8'
  }
}

const getActionText = (action) => {
  switch (action) {
    case 'LOGIN': return 'KIRISH'
    case 'LOGOUT': return 'CHIQISH'
    case 'CREATE_ADMIN': return 'ADMIN YARATISH'
    case 'DELETE_ADMIN': return 'ADMIN O\'CHIRISH'
    case 'TOGGLE_ADMIN_STATUS': return 'HOLAT O\'ZGARTIRISH'
    default: return action
  }
}

export default AdminManagement