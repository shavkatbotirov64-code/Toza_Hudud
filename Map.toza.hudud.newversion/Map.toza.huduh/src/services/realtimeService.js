import { io } from 'socket.io-client';

class RealtimeService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  connect(url = 'http://localhost:3002') {
    if (this.socket) {
      console.log('🔌 Already connected to WebSocket');
      return;
    }

    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('✅ [DRIVER] WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('❌ [DRIVER] WebSocket disconnected');
    });

    this.socket.on('mapUpdate', (data) => {
      const listeners = this.listeners.get('mapUpdate') || [];
      listeners.forEach((callback) => callback(data));
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
