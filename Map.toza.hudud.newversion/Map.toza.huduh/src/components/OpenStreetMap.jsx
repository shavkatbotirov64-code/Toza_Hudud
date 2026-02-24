// 🗺️ UNIVERSAL OPENSTREETMAP COMPONENT
// Bu komponent barcha loyihalarda ishlatiladi: frontend, Map.toza.huduh, va boshqalar
// openstreetmap-website kodlaridan olingan

import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// OpenStreetMap Layer Definitions (openstreetmap-website dan)
const OSM_LAYERS = {
  mapnik: {
    name: 'OpenStreetMap Standard',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  cyclosm: {
    name: 'CyclOSM',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. Tiles courtesy of <a href="https://www.openstreetmap.fr">OpenStreetMap France</a>',
    maxZoom: 20,
    subdomains: 'abc'
  },
  hot: {
    name: 'Humanitarian',
    url: 'https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. Tiles courtesy of <a href="http://hot.openstreetmap.org/">Humanitarian OpenStreetMap Team</a>',
    maxZoom: 20,
    subdomains: 'abc'
  },
  dark: {
    name: 'Dark Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19,
    subdomains: 'abcd'
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri',
    maxZoom: 18
  }
}

/**
 * Universal OpenStreetMap Component
 * 
 * @param {Object} props
 * @param {Array} props.center - [lat, lng] xarita markazi
 * @param {Number} props.zoom - Boshlang'ich zoom darajasi
 * @param {String} props.style - Xarita stili (mapnik, cyclosm, hot, dark, satellite)
 * @param {Array} props.bins - Qutilar ro'yxati
 * @param {Array} props.vehicles - Mashinalar ro'yxati
 * @param {Function} props.onBinClick - Qutiga bosilganda
 * @param {Function} props.onVehicleClick - Mashinaga bosilganda
 * @param {Boolean} props.showControls - Boshqaruvlarni ko'rsatish
 * @param {String} props.height - Xarita balandligi
 */
const OpenStreetMap = ({
  center = [39.6542, 66.9597], // Samarqand
  zoom = 13,
  style = 'mapnik',
  bins = [],
  vehicles = [],
  onBinClick = () => {},
  onVehicleClick = () => {},
  showControls = true,
  height = '100%'
}) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const baseLayerRef = useRef(null)
  const markersRef = useRef([])
  const routeLayersRef = useRef([])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Create map
    const map = L.map(mapRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: showControls,
      attributionControl: true,
      preferCanvas: true
    })

    mapInstanceRef.current = map

    // Add base layer
    const layer = OSM_LAYERS[style] || OSM_LAYERS.mapnik
    baseLayerRef.current = L.tileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: layer.maxZoom,
      subdomains: layer.subdomains || ['a', 'b', 'c']
    }).addTo(map)

    // Add scale control
    if (showControls) {
      L.control.scale({
        position: 'bottomleft',
        imperial: false,
        metric: true
      }).addTo(map)
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Change map style
  useEffect(() => {
    if (!mapInstanceRef.current || !baseLayerRef.current) return

    const map = mapInstanceRef.current
    map.removeLayer(baseLayerRef.current)

    const layer = OSM_LAYERS[style] || OSM_LAYERS.mapnik
    baseLayerRef.current = L.tileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: layer.maxZoom,
      subdomains: layer.subdomains || ['a', 'b', 'c']
    }).addTo(map)
  }, [style])

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // Clear old markers
    markersRef.current.forEach(marker => map.removeLayer(marker))
    markersRef.current = []
    routeLayersRef.current.forEach(layer => map.removeLayer(layer))
    routeLayersRef.current = []

    // Add bin markers
    bins.forEach(bin => {
      const color = getBinColor(bin.status)
      const icon = L.divIcon({
        html: `
          <div style="
            background: ${color};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            border: 3px solid white;
            cursor: pointer;
          ">
            🗑️
          </div>
        `,
        className: 'osm-bin-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })

      const marker = L.marker(bin.location, { icon })
        .addTo(map)
        .bindPopup(createBinPopup(bin))
        .on('click', () => onBinClick(bin))

      markersRef.current.push(marker)
    })

    // Add vehicle markers
    vehicles.forEach(vehicle => {
      const color = vehicle.status === 'moving' ? '#3b82f6' : '#10b981'
      const icon = L.divIcon({
        html: `
          <div style="
            background: ${color};
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            border: 3px solid white;
            cursor: pointer;
          ">
            🚛
          </div>
        `,
        className: 'osm-vehicle-marker',
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      })

      const marker = L.marker(vehicle.coordinates, { icon })
        .addTo(map)
        .bindPopup(createVehiclePopup(vehicle))
        .on('click', () => onVehicleClick(vehicle))

      markersRef.current.push(marker)

      // Draw active route path for vehicle (if available from backend)
      if (Array.isArray(vehicle.routePath) && vehicle.routePath.length > 1) {
        const routeLine = L.polyline(vehicle.routePath, {
          color,
          weight: 4,
          opacity: 0.85,
          smoothFactor: 1,
          dashArray: vehicle.status === 'moving' ? null : '8, 6'
        }).addTo(map)

        routeLayersRef.current.push(routeLine)
      }
    })
  }, [bins, vehicles])

  // Helper functions
  const getBinColor = (status) => {
    if (status >= 90) return '#ef4444'
    if (status >= 70) return '#f59e0b'
    if (status >= 50) return '#eab308'
    if (status >= 30) return '#84cc16'
    return '#22c55e'
  }

  const createBinPopup = (bin) => {
    const color = getBinColor(bin.status)
    return `
      <div style="min-width: 250px; font-family: system-ui;">
        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
          🗑️ ${bin.id}
        </h3>
        <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">Holat</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="flex: 1; background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: ${color}; height: 100%; width: ${bin.status}%;"></div>
            </div>
            <span style="font-weight: 600; color: ${color};">${bin.status}%</span>
          </div>
        </div>
        <div style="font-size: 13px; color: #4b5563;">
          <div style="margin-bottom: 6px;">
            <strong>📍 Manzil:</strong><br/>
            ${bin.address}
          </div>
          <div>
            <strong>📦 Sig'im:</strong> ${bin.capacity}L
          </div>
        </div>
      </div>
    `
  }

  const createVehiclePopup = (vehicle) => {
    const color = vehicle.status === 'moving' ? '#3b82f6' : '#10b981'
    return `
      <div style="min-width: 250px; font-family: system-ui;">
        <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
          🚛 ${vehicle.id}
        </h3>
        <div style="background: ${color}; color: white; padding: 6px 12px; border-radius: 6px; margin-bottom: 12px; text-align: center; font-weight: 600;">
          ${vehicle.status === 'moving' ? 'Harakatda' : 'Faol'}
        </div>
        <div style="font-size: 13px; color: #4b5563;">
          <div style="margin-bottom: 8px;">
            <strong>👤 Haydovchi:</strong><br/>
            ${vehicle.driver}
          </div>
          <div>
            <strong>⚡ Tezlik:</strong> ${vehicle.speed || 0} km/h
          </div>
        </div>
      </div>
    `
  }

  return (
    <div ref={mapRef} style={{ width: '100%', height: height }}>
      <style>{`
        .osm-bin-marker:hover,
        .osm-vehicle-marker:hover {
          transform: scale(1.1);
          transition: transform 0.2s;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .leaflet-popup-tip {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default OpenStreetMap
