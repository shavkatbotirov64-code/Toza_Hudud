# Statistika API

Backend'da statistika uchun to'liq API mavjud.

## Endpoints

### 1. Dashboard Statistikasi
```
GET /statistics/dashboard
GET /analytics/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "cleanings": 5,
      "distance": "12.50"
    },
    "total": {
      "cleanings": 150,
      "bins": 10,
      "vehicles": 2,
      "distance": "450.75"
    },
    "current": {
      "fullBins": 2,
      "activeVehicles": 1
    },
    "averages": {
      "cleaningDuration": 15
    }
  }
}
```

### 2. Mashinalar Statistikasi
```
GET /statistics/vehicles
GET /analytics/vehicles
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVehicles": 2,
    "activeVehicles": 1,
    "topVehicles": [
      {
        "vehicleId": "VEH-001",
        "driver": "Driver 1",
        "status": "moving",
        "isMoving": true,
        "totalCleanings": 75,
        "totalDistance": "225.50",
        "lastCleaningTime": "2026-02-19T10:30:00Z"
      }
    ],
    "allVehicles": [...]
  }
}
```

### 3. Qutilar Statistikasi
```
GET /statistics/bins
GET /analytics/bins
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBins": 10,
    "fullBins": 2,
    "emptyBins": 8,
    "topBins": [
      {
        "binId": "ESP32-IBN-SINO",
        "location": "Ibn Sino ko'chasi 17A",
        "status": "EMPTY",
        "fillLevel": 15,
        "totalCleanings": 25,
        "lastCleaning": "2026-02-19T10:30:00Z"
      }
    ],
    "allBins": [...]
  }
}
```

### 4. Haftalik Statistika
```
GET /statistics/weekly
GET /analytics/weekly
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2026-02-12",
      "to": "2026-02-19"
    },
    "totalCleanings": 35,
    "totalDistance": "105.25",
    "averagePerDay": 5.0,
    "dailyStats": [
      { "cleanings": 5, "distance": 15.5 },
      { "cleanings": 4, "distance": 12.0 },
      ...
    ]
  }
}
```

### 5. Oylik Statistika
```
GET /statistics/monthly?year=2026&month=2
GET /analytics/monthly?year=2026&month=2
```

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2026,
    "month": 2,
    "totalCleanings": 150,
    "totalDistance": "450.75",
    "totalDuration": 2250,
    "averagePerDay": 5.4,
    "dailyStats": [...]
  }
}
```

### 6. Kunlik Statistika
```
GET /statistics/daily?date=2026-02-19
GET /analytics/daily?date=2026-02-19
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-02-19",
    "cleanings": 5,
    "totalDistance": 15.5,
    "totalDuration": 75,
    "averageDuration": 15,
    "hourlyDistribution": [0, 0, 0, 1, 2, 1, 0, ...],
    "cleaningsList": [...]
  }
}
```

### 7. Samaradorlik Ko'rsatkichlari
```
GET /statistics/efficiency
GET /analytics/efficiency
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "from": "2026-01-20",
      "to": "2026-02-19",
      "days": 30
    },
    "averages": {
      "cleaningsPerDay": 5.0,
      "durationMinutes": 15,
      "distanceKm": 3.5
    },
    "records": {
      "fastest": {
        "duration": 8,
        "binId": "ESP32-IBN-SINO",
        "vehicleId": "VEH-001"
      },
      "slowest": {
        "duration": 25,
        "binId": "BIN-002",
        "vehicleId": "VEH-002"
      }
    },
    "totalCleanings": 150
  }
}
```

## Frontend'da Ishlatish

### React Example:
```javascript
import { useEffect, useState } from 'react';

function Dashboard() {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetch('https://tozahudud-production-d73f.up.railway.app/statistics/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.data);
        }
      });
  }, []);
  
  if (!stats) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <h2>Bugun</h2>
        <p>Tozalashlar: {stats.today.cleanings}</p>
        <p>Masofa: {stats.today.distance} km</p>
      </div>
      <div>
        <h2>Jami</h2>
        <p>Tozalashlar: {stats.total.cleanings}</p>
        <p>Qutilar: {stats.total.bins}</p>
        <p>Mashinalar: {stats.total.vehicles}</p>
      </div>
    </div>
  );
}
```

## Test Qilish

```bash
# Backend papkasida
node test-statistics-api.js
```

Yoki browser'da:
```
https://tozahudud-production-d73f.up.railway.app/statistics/dashboard
https://tozahudud-production-d73f.up.railway.app/statistics/vehicles
https://tozahudud-production-d73f.up.railway.app/statistics/bins
```
