import 'leaflet/dist/leaflet.css'
import { useEffect, useState, useRef } from 'react'
import YandexMapShared from '../../../../shared/components/YandexMap.jsx'
import { realtimeService } from '../services/realtimeService.js'
import { getMapTranslation } from '../../../../shared/translations/mapTranslations.js'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'

interface LiveMapProps {
  compact?: boolean
}

const LiveMap = ({ compact = false }: LiveMapProps) => {
  const { language } = useLanguage()
  const [bins, setBins] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [binsData, setBinsData] = useState<any[]>([])
  const [vehiclesData, setVehiclesData] = useState<any[]>([])
  const isInitializedRef = useRef(false)
  
  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load bins
        const binsResult = await api.getBins()
        if (binsResult.success && binsResult.data) {
          let binsArray = Array.isArray(binsResult.data) ? binsResult.data : binsResult.data.data || []
          setBinsData(binsArray)
        }
        
        // Load vehicles
        const vehiclesResult = await api.getVehicles()
        if (vehiclesResult.success && vehiclesResult.data) {
          let vehiclesArray = Array.isArray(vehiclesResult.data) ? vehiclesResult.data : vehiclesResult.data.data || []
          setVehiclesData(vehiclesArray)
        }
      } catch (error) {
        console.error('❌ [DRIVER] Error loading data:', error)
      }
    }
    
    loadData()
  }, [])
  
  // Initialize MapDataService when data is loaded
  useEffect(() => {
    if (isInitializedRef.current) return
    if (!binsData || binsData.length === 0 || !vehiclesData || vehiclesData.length === 0) {
      return
    }
    
    // Transform backend data to display format
    const formattedBins = binsData.map(bin => ({
      id: bin.code,
      location: [parseFloat(bin.latitude), parseFloat(bin.longitude)],
      address: bin.address,
      fillLevel: parseFloat(bin.fillLevel),
      capacity: bin.capacity,
    }))
    
    const formattedVehicles = vehiclesData.map(vehicle => ({
      id: vehicle.code || vehicle.licensePlate,
      driver: vehicle.driverName,
      status: vehicle.status === 'moving' ? 'moving' : 'idle',
      location: vehicle.currentLatitude && vehicle.currentLongitude 
        ? [parseFloat(vehicle.currentLatitude), parseFloat(vehicle.currentLongitude)]
        : [39.6542, 66.9597],
    }))
    
    console.log('📖 [DRIVER] Running in RECEIVE-ONLY mode')
    
    // Initialize WebSocket (RECEIVE ONLY)
    realtimeService.connect()
    
    // Listen for updates from server
    realtimeService.onMapUpdate((data) => {
      console.log('📥 [DRIVER] Received update from server')
      setBins(data.bins)
      setVehicles(data.vehicles)
    })
    
    // Set initial data
    setBins(formattedBins)
    setVehicles(formattedVehicles)
    
    isInitializedRef.current = true
    
    return () => {
      realtimeService.disconnect()
    }
  }, [binsData, vehiclesData])
  
  const t = getMapTranslation(language || 'uz')
  
  if (bins.length === 0 || vehicles.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#3b82f6' }}></i>
        <div>Xarita yuklanmoqda...</div>
      </div>
    )
  }
  
  return <YandexMapShared 
    compact={compact} 
    bins={bins}
    vehicles={vehicles}
    t={t} 
    language={language || 'uz'} 
  />
}

export default LiveMap
