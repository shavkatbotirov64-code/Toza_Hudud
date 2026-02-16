import React, { useState, useMemo } from 'react'
import { useAppContext } from '../context/AppContext'
import { useTranslation } from '../hooks/useTranslation'
import BinDetailModal from './BinDetailModal'
import AddBinModal from './AddBinModal'
import ApiService from '../services/api'

const Bins = () => {
  const { binsData, setBinsData, showToast, apiConnected, refreshData } = useAppContext()
  const { t } = useTranslation()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [selectedBin, setSelectedBin] = useState(null)
  const [showBinDetail, setShowBinDetail] = useState(false)
  const [showAddBin, setShowAddBin] = useState(false)
  const [binToEdit, setBinToEdit] = useState(null)
  const itemsPerPage = 10

  const handleDeleteBin = async (binId) => {
    if (!confirm(t('bins.deleteConfirm') || 'Haqiqatan ham bu qutini o\'chirmoqchimisiz?')) return
    
    if (apiConnected) {
      try {
        // Find the bin with backend ID
        const binToDelete = binsData.find(bin => bin.id === binId)
        if (binToDelete && binToDelete._backendId) {
          const result = await ApiService.deleteBin(binToDelete._backendId)
          if (result.success) {
            setBinsData(prev => prev.filter(bin => bin.id !== binId))
            showToast(t('bins.deleteSuccess') || 'Quti muvaffaqiyatli o\'chirildi', 'success')
            refreshData() // Refresh to sync with backend
          } else {
            showToast(t('bins.deleteError') || 'Qutini o\'chirishda xatolik yuz berdi', 'error')
          }
        }
      } catch (error) {
        console.error('Error deleting bin:', error)
        showToast(t('bins.deleteError') || 'Qutini o\'chirishda xatolik yuz berdi', 'error')
      }
    } else {
      // Mock mode - just remove from local state
      setBinsData(prev => prev.filter(bin => bin.id !== binId))
      showToast(t('bins.deleteSuccessDemo') || 'Quti o\'chirildi (demo rejim)', 'success')
    }
  }

  const handleCleanBin = async (binId) => {
    if (apiConnected) {
      try {
        const binToClean = binsData.find(bin => bin.id === binId)
        if (binToClean && binToClean._backendId) {
          const result = await ApiService.updateBin(binToClean._backendId, { 
            fillLevel: 0,
            lastCleaned: new Date().toISOString()
          })
          if (result.success) {
            setBinsData(prev => prev.map(bin => 
              bin.id === binId 
                ? { ...bin, status: 0, lastCleaned: new Date().toLocaleDateString('uz-UZ') }
                : bin
            ))
            showToast(t('bins.cleanSuccess') || 'Quti tozalandi deb belgilandi', 'success')
            refreshData() // Refresh to sync with backend
          } else {
            showToast(t('bins.cleanError') || 'Qutini tozalashda xatolik yuz berdi', 'error')
          }
        }
      } catch (error) {
        console.error('Error cleaning bin:', error)
        showToast(t('bins.cleanError') || 'Qutini tozalashda xatolik yuz berdi', 'error')
      }
    } else {
      // Mock mode
      setBinsData(prev => prev.map(bin => 
        bin.id === binId 
          ? { ...bin, status: 0, lastCleaned: new Date().toLocaleDateString('uz-UZ') }
          : bin
      ))
      showToast(t('bins.cleanSuccessDemo') || 'Quti tozalandi (demo rejim)', 'success')
    }
  }

  const filteredBins = useMemo(() => {
    let filtered = [...binsData]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(bin =>
        bin.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bin.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bin.district.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bin => {
        if (statusFilter === 'empty') return bin.status < 30
        if (statusFilter === 'half') return bin.status >= 30 && bin.status < 70
        if (statusFilter === 'warning') return bin.status >= 70 && bin.status < 90
        if (statusFilter === 'full') return bin.status >= 90
        return true
      })
    }

    // Area filter
    if (areaFilter !== 'all') {
      filtered = filtered.filter(bin => bin.district === areaFilter)
    }

    return filtered
  }, [binsData, searchTerm, statusFilter, areaFilter])

  const totalPages = Math.ceil(filteredBins.length / itemsPerPage)
  const paginatedBins = filteredBins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const getStatusColor = (status) => {
    if (status >= 90) return '#ef4444'
    if (status >= 70) return '#f59e0b'
    if (status >= 30) return '#eab308'
    return '#10b981'
  }

  const getStatusBadge = (status) => {
    if (status >= 90) return <span className="badge danger">{t('status.full')}</span>
    if (status >= 70) return <span className="badge warning">{t('status.warning')}</span>
    if (status >= 30) return <span className="badge info">{t('status.half')}</span>
    return <span className="badge success">{t('status.empty')}</span>
  }

  const clearSearch = () => {
    setSearchTerm('')
    showToast(t('messages.searchCleared'), 'info')
  }

  const exportBinsData = () => {
    showToast(t('messages.dataExporting'), 'info')
    const dataStr = JSON.stringify(binsData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `smart-trash-bins-${new Date().toISOString().slice(0, 10)}.json`
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    showToast(t('messages.dataExported'), 'success')
  }

  const handleViewBin = (bin) => {
    setSelectedBin(bin)
    setShowBinDetail(true)
  }

  const handleEditBin = (bin) => {
    setBinToEdit(bin)
    setShowAddBin(true)
  }

  return (
    <div id="binsTab" className="tab-content active">
      <div className="section-header">
        <div className="header-left">
          <h3><i className="fas fa-trash-alt"></i> {t('bins.title')}</h3>
          <p>
            {binsData.length} {t('bins.monitoring')}
            {apiConnected && <span style={{ color: '#10b981', marginLeft: '10px' }}>
              <i className="fas fa-check-circle"></i> API bog'langan
            </span>}
            {!apiConnected && <span style={{ color: '#f59e0b', marginLeft: '10px' }}>
              <i className="fas fa-exclamation-triangle"></i> Demo rejim
            </span>}
          </p>
        </div>
        <div className="header-right">
          <button className="btn btn-primary" onClick={() => {
            setBinToEdit(null)
            setShowAddBin(true)
          }}>
            <i className="fas fa-plus"></i> {t('bins.addNew')}
          </button>
          <button className="btn btn-secondary" onClick={exportBinsData}>
            <i className="fas fa-download"></i> {t('bins.export')}
          </button>
          {apiConnected && (
            <button className="btn btn-info" onClick={refreshData}>
              <i className="fas fa-sync-alt"></i> {t('common.refresh')}
            </button>
          )}
        </div>
      </div>

      <div className="filter-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            id="binsSearch"
            placeholder={t('bins.search')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
          {searchTerm && (
            <button className="search-clear" onClick={clearSearch}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="all">{t('bins.allStatuses')}</option>
            <option value="empty">{t('bins.empty')}</option>
            <option value="half">{t('bins.half')}</option>
            <option value="warning">{t('bins.warning')}</option>
            <option value="full">{t('bins.full')}</option>
          </select>

          <select
            className="filter-select"
            value={areaFilter}
            onChange={(e) => {
              setAreaFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="all">{t('bins.allAreas')}</option>
            <option value="samarqand">{t('districts.samarqand')}</option>
          </select>
        </div>
      </div>

      <div className="content-card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('bins.binId')}</th>
                  <th>{t('bins.address')}</th>
                  <th>{t('bins.status')}</th>
                  <th>{t('bins.fillLevel')}</th>
                  <th>{t('bins.lastUpdate')}</th>
                  <th>{t('bins.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBins.map((bin) => {
                  const color = getStatusColor(bin.status)
                  return (
                    <tr key={bin.id}>
                      <td>
                        <strong style={{ color }}>{bin.id}</strong>
                        {apiConnected && bin._backendId && (
                          <div style={{ fontSize: '10px', color: '#666' }}>
                            Backend ID: {bin._backendId.slice(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td>
                        <div>{bin.address}</div>
                        <small className="text-muted">{bin.district}</small>
                      </td>
                      <td>
                        {getStatusBadge(bin.status)}
                        <div className={`status-badge ${bin.online ? 'online' : 'offline'}`}>
                          <i className={`fas fa-${bin.online ? 'wifi' : 'times-circle'}`}></i>
                          {bin.online ? t('status.online') : t('status.offline')}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span>{bin.status}%</span>
                          <div className="progress-bar" style={{ flex: 1 }}>
                            <div className="progress-fill" style={{ width: `${bin.status}%`, background: color }}></div>
                          </div>
                        </div>
                      </td>
                      <td>{bin.lastUpdate}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-icon" onClick={() => handleViewBin(bin)} title={t('bins.view')}>
                            <i className="fas fa-eye"></i>
                          </button>
                          <button className="btn-icon" onClick={() => handleEditBin(bin)} title={t('bins.edit')}>
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="btn-icon success" onClick={() => handleCleanBin(bin.id)} title={t('bins.clean')}>
                            <i className="fas fa-broom"></i>
                          </button>
                          <button className="btn-icon danger" onClick={() => handleDeleteBin(bin.id)} title={t('bins.delete')}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="page-info">
                {t('bins.page')} {currentPage}/{totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
            <div className="table-summary">
              <span className="summary-item">
                <span className="summary-dot success"></span>
                <span>{filteredBins.filter(b => b.status < 30).length} {t('bins.emptyCount')}</span>
              </span>
              <span className="summary-item">
                <span className="summary-dot warning"></span>
                <span>{filteredBins.filter(b => b.status >= 70 && b.status < 90).length} {t('bins.warningCount')}</span>
              </span>
              <span className="summary-item">
                <span className="summary-dot danger"></span>
                <span>{filteredBins.filter(b => b.status >= 90).length} {t('bins.fullCount')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <BinDetailModal 
        isOpen={showBinDetail} 
        onClose={() => {
          setShowBinDetail(false)
          setSelectedBin(null)
        }} 
        bin={selectedBin} 
      />
      <AddBinModal 
        isOpen={showAddBin} 
        onClose={() => {
          setShowAddBin(false)
          setBinToEdit(null)
        }} 
        binToEdit={binToEdit}
        apiConnected={apiConnected}
        onBinAdded={refreshData}
      />
    </div>
  )
}

export default Bins

