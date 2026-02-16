// API Service - Clean version without console.logs
// Use backend URL directly since nginx proxy is not working
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3002'  // Local development
  : 'https://tozahudud-production-d73f.up.railway.app';  // Production backend - NO /api prefix

// Error handling function
const handleApiError = (error, context) => {
  // Silent error handling - no console logs
};

class ApiService {
  // Bins API
  async testConnection() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getBins() {
    try {
      const response = await fetch(`${API_BASE_URL}/bins`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createBin(binData) {
    try {
      const response = await fetch(`${API_BASE_URL}/bins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(binData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateBin(id, binData) {
    try {
      const response = await fetch(`${API_BASE_URL}/bins/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(binData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteBin(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/bins/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async cleanBin(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/bins/${id}/clean`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Vehicles API
  async getVehicles() {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createVehicle(vehicleData) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateVehicle(id, vehicleData) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteVehicle(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Alerts API
  async getAlerts() {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateAlert(id, alertData) {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteAlert(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sensors API (NO /api prefix)
  async getSensorData(limit = 50) {
    try {
      const url = window.location.hostname === 'localhost'
        ? `http://localhost:3002/sensors/latest?limit=${limit}`
        : `https://tozahudud-production-d73f.up.railway.app/sensors/latest?limit=${limit}`;
      
      console.log(`🔍 Fetching sensor data from: ${url}`);
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('✅ Sensor data received:', result);
      return { success: true, data: result.data || [] };
    } catch (error) {
      console.error('❌ getSensorData error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async getSensorAlerts(limit = 20) {
    try {
      const url = window.location.hostname === 'localhost'
        ? `http://localhost:3002/sensors/alerts?limit=${limit}`
        : `https://tozahudud-production-d73f.up.railway.app/sensors/alerts?limit=${limit}`;
      
      console.log(`🔍 Fetching sensor alerts from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('✅ Sensor alerts received:', result);
      return { success: true, data: result.data || [] };
    } catch (error) {
      console.error('❌ getSensorAlerts error:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async getSensorStats() {
    try {
      const url = window.location.hostname === 'localhost'
        ? `http://localhost:3002/sensors/stats`
        : `https://tozahudud-production-d73f.up.railway.app/sensors/stats`;
      
      console.log(`🔍 Fetching sensor stats from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('✅ Sensor stats received:', result);
      return { success: true, data: result.data || {} };
    } catch (error) {
      console.error('❌ getSensorStats error:', error);
      return { success: false, error: error.message, data: {} };
    }
  }

  // Telegram API
  async getTelegramBotInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/bot-info`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getTelegramStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/stats`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getTelegramReports(limit = 10) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/telegram/reports?limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getTelegramFeedbacks(limit = 10) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/telegram/feedbacks?limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getTelegramUsers(limit = 50) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/telegram/users?limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getAllTelegramUsers(limit = 100) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/telegram/all-users?limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendTelegramBroadcast(message) {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async setTelegramWebhook(url) {
    try {
      const response = await fetch(`${API_BASE_URL}/telegram/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Data transformation functions
  transformBinData(backendBin) {
    try {
      console.log('🗑 Transforming bin data:', backendBin);

      const transformedBin = {
        id: backendBin.code, // Frontend'da code ni id sifatida ishlatish
        _backendId: backendBin.id, // Backend UUID'ni saqlash
        address: backendBin.address,
        district: backendBin.district,
        location: [
          parseFloat(backendBin.latitude),
          parseFloat(backendBin.longitude),
        ],
        status: this.getFillLevelStatus(parseFloat(backendBin.fillLevel)),
        lastUpdate: new Date(backendBin.lastUpdate).toLocaleTimeString(
          'uz-UZ',
          {
            hour: '2-digit',
            minute: '2-digit',
          },
        ),
        lastCleaned: backendBin.lastCleaned
          ? new Date(backendBin.lastCleaned).toLocaleDateString('uz-UZ') +
            ' ' +
            new Date(backendBin.lastCleaned).toLocaleTimeString('uz-UZ', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Hech qachon',
        capacity: backendBin.capacity,
        type: backendBin.type,
        sensorId: backendBin.sensorId,
        online: backendBin.isOnline,
        installDate: new Date(backendBin.createdAt).toLocaleDateString('uz-UZ'),
        fillLevel: parseFloat(backendBin.fillLevel),
        batteryLevel: backendBin.batteryLevel || 100,
      };

      console.log('✅ Bin transformed successfully:', transformedBin);
      return transformedBin;
    } catch (error) {
      console.error('❌ Error transforming bin data:', error);
      console.error('❌ Original bin data:', backendBin);

      // Return safe fallback data
      return {
        id: backendBin?.code || `bin-${Date.now()}`,
        _backendId: backendBin?.id || null,
        address: "Xatolik - Ma'lumot yo'q",
        district: "Noma'lum",
        location: [41.2995, 69.2401],
        status: 0,
        lastUpdate: new Date().toLocaleTimeString('uz-UZ', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        lastCleaned: "Ma'lumot yo'q",
        capacity: 0,
        type: 'standard',
        sensorId: null,
        online: false,
        installDate: new Date().toLocaleDateString('uz-UZ'),
        fillLevel: 0,
        batteryLevel: 0,
      };
    }
  }

  transformVehicleData(backendVehicle) {
    try {
      console.log('🔧 Transforming vehicle data:', backendVehicle);

      const transformedVehicle = {
        id: backendVehicle.vehicleId, // VEH-001
        _backendId: backendVehicle.id, // Backend UUID
        driver: backendVehicle.driver || "Noma'lum",
        phone: backendVehicle.phone || "+998 00 000 00 00",
        status: backendVehicle.isMoving ? 'moving' : 'active',
        location: `${parseFloat(backendVehicle.latitude || 0).toFixed(4)}, ${parseFloat(backendVehicle.longitude || 0).toFixed(4)}`,
        cleaned: backendVehicle.totalCleanings || 0,
        position: [
          parseFloat(backendVehicle.latitude || 39.6650),
          parseFloat(backendVehicle.longitude || 66.9600),
        ],
        isMoving: backendVehicle.isMoving || false,
        isPatrolling: !backendVehicle.isMoving && backendVehicle.status === 'idle',
        hasCleanedOnce: false,
        routePath: null,
        currentPathIndex: 0,
        patrolRoute: [],
        patrolIndex: 0,
        patrolWaypoints: [
          // Default patrol waypoints - frontend'da o'zgartiriladi
          [parseFloat(backendVehicle.latitude || 39.6650), parseFloat(backendVehicle.longitude || 66.9600)],
          [parseFloat(backendVehicle.latitude || 39.6650) + 0.005, parseFloat(backendVehicle.longitude || 66.9600) + 0.005],
          [parseFloat(backendVehicle.latitude || 39.6650) + 0.01, parseFloat(backendVehicle.longitude || 66.9600) + 0.01],
        ],
        currentWaypointIndex: 0,
        targetBinId: backendVehicle.targetBinId || null,
        lastCleaned: backendVehicle.lastCleaningTime 
          ? new Date(backendVehicle.lastCleaningTime).toLocaleDateString('uz-UZ')
          : "Hech qachon",
        totalDistance: parseFloat(backendVehicle.totalDistanceTraveled || 0),
      };

      console.log('✅ Vehicle transformed successfully:', transformedVehicle);
      return transformedVehicle;
    } catch (error) {
      console.error('❌ Error transforming vehicle data:', error);
      console.error('❌ Original vehicle data:', backendVehicle);

      // Return safe fallback data
      return {
        id: backendVehicle?.id || `vehicle-${Date.now()}`,
        _backendId: backendVehicle?.id || null,
        driver: "Xatolik - Ma'lumot yo'q",
        phone: "Noma'lum",
        licensePlate: "Noma'lum",
        location: "Noma'lum",
        status: 'inactive',
        lastUpdate: new Date().toLocaleTimeString('uz-UZ', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        route: 'Xatolik',
        capacity: 0,
        fuelLevel: 0,
        speed: 0,
        cleaned: 0,
        type: 'medium_truck',
        coordinates: [41.2995, 69.2401],
        lastService: "Ma'lumot yo'q",
        online: false,
      };
    }
  }

  mapVehicleStatus(backendStatus) {
    try {
      console.log('🔄 Mapping vehicle status:', backendStatus);

      switch (backendStatus) {
        case 'moving':
          return 'moving';
        case 'active':
          return 'active';
        case 'inactive':
          return 'inactive';
        case 'maintenance':
          return 'inactive';
        default:
          console.warn('⚠️ Unknown vehicle status:', backendStatus);
          return 'inactive';
      }
    } catch (error) {
      console.error('❌ Error mapping vehicle status:', error);
      return 'inactive';
    }
  }

  transformAlertData(backendAlert) {
    try {
      console.log('🚨 Transforming alert data:', backendAlert);

      // Map backend severity to frontend type
      const mapSeverityToType = (severity) => {
        const severityLower = severity?.toLowerCase();
        switch (severityLower) {
          case 'critical':
          case 'high':
            return 'danger';
          case 'medium':
            return 'warning';
          case 'low':
            return 'info';
          default:
            return 'info';
        }
      };

      const transformedAlert = {
        id: backendAlert.id,
        title: backendAlert.title || 'Ogohlantirish',
        message: backendAlert.message || "Ma'lumot yo'q",
        type: mapSeverityToType(backendAlert.severity),
        location: backendAlert.location || "Noma'lum",
        time: new Date(backendAlert.createdAt).toLocaleTimeString('uz-UZ', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        read: backendAlert.isRead || false,
        priority: backendAlert.severity?.toLowerCase() || 'medium',
      };

      console.log('✅ Alert transformed successfully:', transformedAlert);
      return transformedAlert;
    } catch (error) {
      console.error('❌ Error transforming alert data:', error);
      console.error('❌ Original alert data:', backendAlert);

      // Return safe fallback data
      return {
        id: backendAlert?.id || `alert-${Date.now()}`,
        title: 'Xatolik',
        message: "Ma'lumotni yuklashda xatolik yuz berdi",
        type: 'info',
        location: "Noma'lum",
        time: new Date().toLocaleTimeString('uz-UZ', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        read: false,
        priority: 'medium',
      };
    }
  }

  getFillLevelStatus(fillLevel) {
    if (fillLevel >= 90) return 3; // To'la
    if (fillLevel >= 70) return 2; // Ogohlantirish
    if (fillLevel >= 30) return 1; // Yarim
    return 0; // Bo'sh
  }

  // Vehicle Status API
  async upsertVehicleStatus(vehicleData) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getVehicleStatus(vehicleId) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateVehicleLocation(vehicleId, latitude, longitude) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async startVehicleMoving(vehicleId, targetBinId) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/start-moving`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetBinId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async stopVehicle(vehicleId) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/stop`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async completeVehicleCleaning(vehicleId) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/complete-cleaning`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addVehicleDistance(vehicleId, distanceKm) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/add-distance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ distanceKm }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Cleaning History API
  async createCleaning(cleaningData) {
    try {
      const response = await fetch(`${API_BASE_URL}/cleanings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleaningData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getCleaningHistory(limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/cleanings/history?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data: data.data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async getCleaningsByBin(binId, limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/cleanings/by-bin/${binId}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data: data.data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async getCleaningsByVehicle(vehicleId, limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/cleanings/by-vehicle/${vehicleId}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data: data.data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async getCleaningStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/cleanings/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data: data.data || {} };
    } catch (error) {
      return { success: false, error: error.message, data: {} };
    }
  }

  async getDailyCleanings() {
    try {
      const response = await fetch(`${API_BASE_URL}/cleanings/daily`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data: data.data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // Routes API
  async optimizeRoute(routeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/routes/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async calculateRoute(startLat, startLon, endLat, endLon) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/routes/calculate?startLat=${startLat}&startLon=${startLon}&endLat=${endLat}&endLon=${endLon}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getRouteHistory(vehicleId, limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/routes/history/${vehicleId}?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data: data.data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async getRoute(routeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/routes/${routeId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateRouteStatus(routeId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/routes/${routeId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // GPS Tracking API
  async saveGpsLocation(vehicleId, gpsData) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/gps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gpsData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getCurrentGpsLocation(vehicleId) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/gps/current`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getGpsHistory(vehicleId, hours = 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/gps-history?hours=${hours}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data: data.data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async trackVehicle(vehicleId, limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/track?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Notifications API
  async sendNotification(notificationData) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getAllNotifications(userId = null, limit = 50) {
    try {
      let url = `${API_BASE_URL}/notifications/list?limit=${limit}`;
      if (userId) {
        url += `&userId=${userId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data: data.data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async getUnreadNotifications(userId = null) {
    try {
      let url = `${API_BASE_URL}/notifications/unread`;
      if (userId) {
        url += `?userId=${userId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data: data.data || [], count: data.count || 0 };
    } catch (error) {
      return { success: false, error: error.message, data: [], count: 0 };
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async markAllNotificationsAsRead(userId = null) {
    try {
      let url = `${API_BASE_URL}/notifications/read-all`;
      if (userId) {
        url += `?userId=${userId}`;
      }
      const response = await fetch(url, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteNotification(notificationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Analytics API
  async getDashboardStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getDailyStats(date = null) {
    try {
      let url = `${API_BASE_URL}/analytics/daily`;
      if (date) {
        url += `?date=${date}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getWeeklyStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/weekly`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getMonthlyStats(year = null, month = null) {
    try {
      let url = `${API_BASE_URL}/analytics/monthly`;
      const params = [];
      if (year) params.push(`year=${year}`);
      if (month) params.push(`month=${month}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getEfficiencyStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/efficiency`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getBinsStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/bins`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getVehiclesStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics/vehicles`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new ApiService();
