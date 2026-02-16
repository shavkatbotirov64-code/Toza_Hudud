import { useEffect, useRef, useState } from 'react'

const YANDEX_API_KEY = 'fb38ff05-f264-4813-bf8c-635ea61597a4'

interface YandexMapProps {
  center?: [number, number]
  zoom?: number
}

const YandexMapLocal = ({ center = [39.6542, 66.9597], zoom = 13 }: YandexMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load Yandex Maps API
  useEffect(() => {
    if ((window as any).ymaps) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_API_KEY}&lang=ru_RU`
    script.async = true
    
    script.onload = () => {
      (window as any).ymaps.ready(() => {
        console.log('✅ Yandex Maps API loaded')
        setIsLoaded(true)
      })
    }
    
    script.onerror = () => {
      console.error('❌ Failed to load Yandex Maps API')
      setError('Yandex Maps API yuklanmadi')
    }
    
    document.head.appendChild(script)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return

    try {
      console.log('🗺️ Initializing Yandex Map...')
      
      const map = new (window as any).ymaps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        controls: ['zoomControl', 'fullscreenControl']
      })

      mapInstanceRef.current = map
      console.log('✅ Yandex Map initialized')
    } catch (err) {
      console.error('❌ Map initialization error:', err)
      setError('Xarita yuklanmadi')
    }
  }, [isLoaded, center, zoom])

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        color: '#ef4444',
        fontSize: '16px',
        fontWeight: '600'
      }}>
        ❌ {error}
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        color: '#6b7280',
        fontSize: '16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🗺️</div>
          <div>Xarita yuklanmoqda...</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        background: '#f0f0f0'
      }} 
    />
  )
}

export default YandexMapLocal
