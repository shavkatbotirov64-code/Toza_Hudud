import 'leaflet/dist/leaflet.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import OpenStreetMap from './OpenStreetMap'
import { realtimeService } from '../services/realtimeService'
import api from '../services/api'

interface LiveMapProps {
  compact?: boolean
  onBinsChange?: (bins: any[]) => void
}

interface DriverBin {
  id: string
  code: string
  sensorId: string
  address: string
  location: [number, number]
  status: number
  fillLevel: number
  capacity: number
  assignedVehicleId?: string | null
  assignmentStatus?: string | null
}

interface DriverVehicle {
  id: string
  driver: string
  status: 'moving' | 'idle'
  coordinates: [number, number]
  speed: number
  targetBinId?: string | null
  routeId?: string | null
}

const DEFAULT_CENTER: [number, number] = [39.6742637, 66.9737814]

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toCoordinates = (
  latRaw: unknown,
  lonRaw: unknown,
  fallback: [number, number] = DEFAULT_CENTER,
): [number, number] => {
  const lat = toFiniteNumber(latRaw)
  const lon = toFiniteNumber(lonRaw)
  if (lat === null || lon === null) return fallback
  return [lat, lon]
}

const toFillLevel = (rawStatus: unknown, rawFillLevel: unknown): number => {
  const fillLevel = toFiniteNumber(rawFillLevel)
  if (fillLevel !== null) return Math.max(0, Math.min(100, fillLevel))

  if (typeof rawStatus === 'string') {
    if (rawStatus.toUpperCase() === 'FULL') return 95
    if (rawStatus.toUpperCase() === 'EMPTY') return 15
  }

  const numericStatus = toFiniteNumber(rawStatus)
  if (numericStatus !== null) return Math.max(0, Math.min(100, numericStatus))

  return 15
}

const normalizeBin = (bin: any): DriverBin => {
  const locationFromArray =
    Array.isArray(bin?.location) && bin.location.length >= 2
      ? toCoordinates(bin.location[0], bin.location[1], DEFAULT_CENTER)
      : null

  const location =
    locationFromArray ||
    toCoordinates(
      bin?.latitude ?? bin?.lat,
      bin?.longitude ?? bin?.lng ?? bin?.lon,
      DEFAULT_CENTER,
    )

  const fillLevel = toFillLevel(bin?.status, bin?.fillLevel)
  const resolvedId = String(bin?.code || bin?.binId || bin?.id || 'UNKNOWN-BIN')

  return {
    id: resolvedId,
    code: String(bin?.code || bin?.binId || resolvedId),
    sensorId: String(bin?.sensorId || bin?.binId || resolvedId),
    address: String(bin?.address || bin?.locationName || bin?.location || 'Noma`lum manzil'),
    location,
    status: fillLevel,
    fillLevel,
    capacity: Number(bin?.capacity || 120),
    assignedVehicleId: bin?.assignedVehicleId || null,
    assignmentStatus: bin?.assignmentStatus || null,
  }
}

const normalizeVehicle = (vehicle: any): DriverVehicle => {
  const coordsFromArray =
    Array.isArray(vehicle?.coordinates) && vehicle.coordinates.length >= 2
      ? toCoordinates(vehicle.coordinates[0], vehicle.coordinates[1], DEFAULT_CENTER)
      : null

  const coordsFromPosition =
    Array.isArray(vehicle?.position) && vehicle.position.length >= 2
      ? toCoordinates(vehicle.position[0], vehicle.position[1], DEFAULT_CENTER)
      : null

  const coordinates =
    coordsFromArray ||
    coordsFromPosition ||
    toCoordinates(
      vehicle?.latitude ?? vehicle?.currentLatitude,
      vehicle?.longitude ?? vehicle?.currentLongitude,
      DEFAULT_CENTER,
    )

  const movingStatus = String(vehicle?.status || '').toLowerCase()
  const isMoving = vehicle?.isMoving === true || movingStatus === 'moving' || movingStatus === 'cleaning'
  const resolvedId = String(
    vehicle?.vehicleId || vehicle?.id || vehicle?.code || vehicle?.licensePlate || 'UNKNOWN-VEH',
  )

  return {
    id: resolvedId,
    driver: String(vehicle?.driver || vehicle?.driverName || 'Noma`lum haydovchi'),
    status: isMoving ? 'moving' : 'idle',
    coordinates,
    speed: Number(vehicle?.speed || 0),
    targetBinId: vehicle?.targetBinId || null,
    routeId: vehicle?.routeId || null,
  }
}

const matchesBin = (bin: DriverBin, patch: any): boolean => {
  const candidates = [
    patch?.id,
    patch?.code,
    patch?.binId,
    patch?.sensorId,
  ]
    .filter(Boolean)
    .map((value) => String(value))

  return candidates.includes(bin.id) || candidates.includes(bin.code) || candidates.includes(bin.sensorId)
}

const LiveMap = ({ compact = false, onBinsChange }: LiveMapProps) => {
  const [bins, setBins] = useState<DriverBin[]>([])
  const [vehicles, setVehicles] = useState<DriverVehicle[]>([])
  const [loading, setLoading] = useState(true)

  const loadSnapshot = useCallback(async () => {
    try {
      const [binsResult, vehiclesResult] = await Promise.all([api.getBins(), api.getVehicles()])

      const binsSource = Array.isArray(binsResult?.data) ? binsResult.data : binsResult?.data?.data || []
      const vehiclesSource = Array.isArray(vehiclesResult?.data)
        ? vehiclesResult.data
        : vehiclesResult?.data?.data || []

      setBins(binsSource.map(normalizeBin))
      setVehicles(vehiclesSource.map(normalizeVehicle))
    } catch (error) {
      console.error('[DRIVER] Snapshot load error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSnapshot()
  }, [loadSnapshot])

  useEffect(() => {
    if (!onBinsChange) return
    onBinsChange(bins)
  }, [bins, onBinsChange])

  useEffect(() => {
    realtimeService.connect()

    const unsubscribers: Array<() => void> = []

    unsubscribers.push(
      realtimeService.onConnect(() => {
        loadSnapshot()
      }),
    )

    unsubscribers.push(
      realtimeService.onBinUpdate((payload: any) => {
        if (!payload) return
        const normalized = normalizeBin(payload)

        setBins((prevBins) => {
          const index = prevBins.findIndex((bin) => matchesBin(bin, payload))
          if (index === -1) return [...prevBins, normalized]

          const nextBins = [...prevBins]
          nextBins[index] = { ...prevBins[index], ...normalized }
          return nextBins
        })
      }),
    )

    unsubscribers.push(
      realtimeService.onBinStatus((payload: any) => {
        const binId = payload?.binId ? String(payload.binId) : ''
        if (!binId) return

        const statusText = String(payload?.status || '').toUpperCase()
        const fillLevel = statusText === 'FULL' ? 95 : 15

        setBins((prevBins) =>
          prevBins.map((bin) =>
            bin.id === binId || bin.code === binId || bin.sensorId === binId
              ? { ...bin, status: fillLevel, fillLevel }
              : bin,
          ),
        )
      }),
    )

    unsubscribers.push(
      realtimeService.onDispatchAssigned((payload: any) => {
        const vehicleId = payload?.vehicleId ? String(payload.vehicleId) : ''
        if (!vehicleId) return

        setVehicles((prevVehicles) =>
          prevVehicles.map((vehicle) =>
            vehicle.id === vehicleId
              ? {
                  ...vehicle,
                  status: 'moving',
                  targetBinId: payload?.binId || vehicle.targetBinId || null,
                  routeId: payload?.routeId || payload?.assignmentId || vehicle.routeId || null,
                }
              : vehicle,
          ),
        )
      }),
    )

    unsubscribers.push(
      realtimeService.onVehicleStateUpdate((payload: any) => {
        const vehicleId = payload?.vehicleId ? String(payload.vehicleId) : ''
        if (!vehicleId) return

        setVehicles((prevVehicles) =>
          prevVehicles.map((vehicle) => {
            if (vehicle.id !== vehicleId) return vehicle

            const normalized = normalizeVehicle({ ...vehicle, ...payload })
            return {
              ...vehicle,
              ...normalized,
              status:
                payload?.isPatrolling === true
                  ? 'idle'
                  : normalized.status,
            }
          }),
        )
      }),
    )

    unsubscribers.push(
      realtimeService.onVehiclePositionUpdate((payload: any) => {
        const vehicleId = payload?.vehicleId ? String(payload.vehicleId) : ''
        if (!vehicleId) return

        const coordinates = toCoordinates(
          payload?.latitude ?? payload?.position?.[0],
          payload?.longitude ?? payload?.position?.[1],
          DEFAULT_CENTER,
        )

        setVehicles((prevVehicles) =>
          prevVehicles.map((vehicle) =>
            vehicle.id === vehicleId
              ? {
                  ...vehicle,
                  coordinates,
                }
              : vehicle,
          ),
        )
      }),
    )

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      realtimeService.disconnect()
    }
  }, [loadSnapshot])

  const mapCenter = useMemo<[number, number]>(() => {
    if (vehicles.length > 0) return vehicles[0].coordinates
    if (bins.length > 0) return bins[0].location
    return DEFAULT_CENTER
  }, [vehicles, bins])

  if (loading) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#3b82f6' }}></i>
        <div>Xarita yuklanmoqda...</div>
      </div>
    )
  }

  return (
    <OpenStreetMap
      center={mapCenter}
      zoom={compact ? 13 : 14}
      bins={bins}
      vehicles={vehicles}
      height="100%"
    />
  )
}

export default LiveMap
