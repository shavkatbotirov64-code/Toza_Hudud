import { io } from 'socket.io-client'

const DEFAULT_SOCKET_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3002'
    : 'https://tozahudud-production-d73f.up.railway.app'

const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  DEFAULT_SOCKET_URL
).replace(/\/+$/, '')

const STREAM_EVENTS = [
  'sensorData',
  'binUpdate',
  'binStatus',
  'dispatchAssigned',
  'vehicleStateUpdate',
  'vehiclePositionUpdate',
]

class RealtimeService {
  constructor() {
    this.socket = null
    this.connected = false
    this.listeners = new Map()
  }

  connect(url = SOCKET_URL) {
    if (this.socket) {
      return
    }

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 20,
    })

    this.socket.on('connect', () => {
      this.connected = true
      this.emitLocal('connect', { socketId: this.socket?.id || null })
    })

    this.socket.on('disconnect', () => {
      this.connected = false
      this.emitLocal('disconnect', {})
    })

    this.socket.on('connect_error', (error) => {
      console.error('[DRIVER] WebSocket connect_error:', error?.message || error)
    })

    STREAM_EVENTS.forEach((eventName) => {
      this.socket.on(eventName, (payload) => {
        this.emitLocal(eventName, payload)
      })
    })
  }

  emitLocal(eventName, payload) {
    const callbacks = this.listeners.get(eventName)
    if (!callbacks || callbacks.size === 0) return

    callbacks.forEach((callback) => {
      try {
        callback(payload)
      } catch (error) {
        console.error(`[DRIVER] Listener failed for ${eventName}:`, error)
      }
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }
    this.listeners.get(eventName).add(callback)

    return () => this.off(eventName, callback)
  }

  off(eventName, callback) {
    const callbacks = this.listeners.get(eventName)
    if (!callbacks) return
    callbacks.delete(callback)
  }

  onConnect(callback) {
    return this.on('connect', callback)
  }

  onDisconnect(callback) {
    return this.on('disconnect', callback)
  }

  onSensorData(callback) {
    return this.on('sensorData', callback)
  }

  onBinUpdate(callback) {
    return this.on('binUpdate', callback)
  }

  onBinStatus(callback) {
    return this.on('binStatus', callback)
  }

  onDispatchAssigned(callback) {
    return this.on('dispatchAssigned', callback)
  }

  onVehicleStateUpdate(callback) {
    return this.on('vehicleStateUpdate', callback)
  }

  onVehiclePositionUpdate(callback) {
    return this.on('vehiclePositionUpdate', callback)
  }
}

export const realtimeService = new RealtimeService()
