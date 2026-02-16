import { io } from 'socket.io-client';

class RealtimeService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  connect(url = 'https://tozahudud-production-d73f.up.railway.app') {
    if (this.socket) {
      console.log('🔌 Already connected to WebSocket');
      return;
    }

    console.log('🔌 Connecting to WebSocket:', url);

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('✅ [DRIVER] WebSocket connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('❌ [DRIVER] WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ [DRIVER] WebSocket connection error:', error.message);
    });

    // Listen for sensor data updates (ESP32 signals)
    this.socket.on('sensorData', (data) => {
      console.log('📥 [WebSocket] Sensor data received:', data);
      const listeners = this.listeners.get('mapUpdate') || [];
      listeners.forEach((callback) => callback({ type: 'sensorData', data }));
    });
    
    // Listen for general map updates
    this.socket.on('mapUpdate', (data) => {
      console.log('📥 [WebSocket] Map update received:', data);
      const listeners = this.listeners.get('mapUpdate') || [];
      listeners.forEach((callback) => callback({ type: 'mapUpdate', data }));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  onMapUpdate(callback) {
    if (!this.listeners.has('mapUpdate')) {
      this.listeners.set('mapUpdate', []);
    }
    this.listeners.get('mapUpdate').push(callback);
  }

  offMapUpdate(callback) {
    const listeners = this.listeners.get('mapUpdate') || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
}

export const realtimeService = new RealtimeService();
