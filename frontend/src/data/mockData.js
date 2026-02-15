// Mock data for the application
export const mockBins = [
  { 
    id: 'BIN-001', 
    address: 'Amir Temur kochasi 123, Yakkasaroy', 
    district: 'yakkasaroy',
    location: [41.284, 69.279],
    status: 95, 
    lastUpdate: '14:30', 
    lastCleaned: '26.12.2025 14:35', 
    capacity: 120,
    type: 'plastic',
    sensorId: 'SENSOR-001',
    online: true,
    installDate: '01.01.2024'
  },
  { 
    id: 'BIN-002', 
    address: 'Mustaqillik maydoni 45, Yunusobod', 
    district: 'yunusobod',
    location: [41.367, 69.292],
    status: 45, 
    lastUpdate: '14:25', 
    lastCleaned: '26.12.2025 09:15', 
    capacity: 150,
    type: 'general',
    sensorId: 'SENSOR-002',
    online: true,
    installDate: '15.02.2024'
  },
  { 
    id: 'BIN-003', 
    address: 'Bobur kochasi 78, Mirzo Ulugbek', 
    district: 'mirzo',
    location: [41.314, 69.336],
    status: 75, 
    lastUpdate: '14:28', 
    lastCleaned: '25.12.2025 18:20', 
    capacity: 200,
    type: 'organic',
    sensorId: 'SENSOR-003',
    online: true,
    installDate: '20.03.2024'
  },
  { 
    id: 'BIN-004', 
    address: 'Yunus Rajabiy 12, Chilonzor', 
    district: 'chilonzor',
    location: [41.286, 69.204],
    status: 20, 
    lastUpdate: '14:20', 
    lastCleaned: '26.12.2025 11:45', 
    capacity: 100,
    type: 'plastic',
    sensorId: 'SENSOR-004',
    online: true,
    installDate: '05.04.2024'
  },
  { 
    id: 'BIN-005', 
    address: 'Navoi kochasi 89, Yakkasaroy', 
    district: 'yakkasaroy',
    location: [41.288, 69.275],
    status: 85, 
    lastUpdate: '14:15', 
    lastCleaned: '26.12.2025 08:30', 
    capacity: 180,
    type: 'general',
    sensorId: 'SENSOR-005',
    online: false,
    installDate: '10.05.2024'
  },
  { 
    id: 'BIN-006', 
    address: 'Shota Rustaveli 56, Yunusobod', 
    district: 'yunusobod',
    location: [41.365, 69.295],
    status: 30, 
    lastUpdate: '14:10', 
    lastCleaned: '26.12.2025 12:20', 
    capacity: 120,
    type: 'organic',
    sensorId: 'SENSOR-006',
    online: true,
    installDate: '25.06.2024'
  },
  { 
    id: 'BIN-007', 
    address: 'Ahmad Donish 90, Mirzo Ulugbek', 
    district: 'mirzo',
    location: [41.312, 69.332],
    status: 60, 
    lastUpdate: '14:05', 
    lastCleaned: '26.12.2025 10:50', 
    capacity: 160,
    type: 'plastic',
    sensorId: 'SENSOR-007',
    online: true,
    installDate: '15.07.2024'
  },
  { 
    id: 'BIN-008', 
    address: 'Furqat 34, Chilonzor', 
    district: 'chilonzor',
    location: [41.284, 69.208],
    status: 95, 
    lastUpdate: '14:00', 
    lastCleaned: '25.12.2025 16:30', 
    capacity: 140,
    type: 'general',
    sensorId: 'SENSOR-008',
    online: true,
    installDate: '01.08.2024'
  },
  { 
    id: 'BIN-009', 
    address: 'Beruniy 67, Yakkasaroy', 
    district: 'yakkasaroy',
    location: [41.281, 69.273],
    status: 40, 
    lastUpdate: '13:55', 
    lastCleaned: '26.12.2025 07:45', 
    capacity: 110,
    type: 'organic',
    sensorId: 'SENSOR-009',
    online: true,
    installDate: '20.09.2024'
  },
  { 
    id: 'BIN-010', 
    address: 'Alisher Navoiy 21, Yunusobod', 
    district: 'yunusobod',
    location: [41.369, 69.298],
    status: 80, 
    lastUpdate: '13:50', 
    lastCleaned: '26.12.2025 06:30', 
    capacity: 170,
    type: 'general',
    sensorId: 'SENSOR-010',
    online: true,
    installDate: '05.10.2024'
  }
]

export const mockVehicles = [
  { 
    id: 'VH-001', 
    driver: 'Alisher Karimov', 
    status: 'moving', 
    cleaned: 12, 
    location: 'Amir Temur kochasi, Yakkasaroy',
    coordinates: [41.284, 69.279],
    capacity: 5000,
    fuel: 85,
    speed: 45,
    route: 'Route A',
    phone: '+998901234567',
    licensePlate: '01A123AA',
    lastService: '20.12.2025',
    currentBins: ['BIN-001', 'BIN-002']
  },
  { 
    id: 'VH-002', 
    driver: 'Sardor Umarov', 
    status: 'moving', 
    cleaned: 15, 
    location: 'Yunusobod 7-mavze',
    coordinates: [41.367, 69.292],
    capacity: 6000,
    fuel: 70,
    speed: 38,
    route: 'Route B',
    phone: '+998902345678',
    licensePlate: '01B234BB',
    lastService: '22.12.2025',
    currentBins: ['BIN-006', 'BIN-007']
  },
  { 
    id: 'VH-003', 
    driver: 'Jasur Rahimov', 
    status: 'active', 
    cleaned: 8, 
    location: 'Chilonzor parki',
    coordinates: [41.286, 69.204],
    capacity: 4500,
    fuel: 40,
    speed: 0,
    route: 'Route C',
    phone: '+998903456789',
    licensePlate: '01C345CC',
    lastService: '25.12.2025',
    currentBins: ['BIN-004']
  },
  { 
    id: 'VH-004', 
    driver: 'Botir Sharipov', 
    status: 'moving', 
    cleaned: 11, 
    location: 'Mirzo Ulugbek tumani',
    coordinates: [41.314, 69.336],
    capacity: 5500,
    fuel: 65,
    speed: 42,
    route: 'Route D',
    phone: '+998904567890',
    licensePlate: '01D456DD',
    lastService: '18.12.2025',
    currentBins: ['BIN-003', 'BIN-009']
  }
]

export const mockActivities = [
  { 
    id: 'ACT-001',
    type: 'danger',
    title: 'Quti #BIN-001 to\'ldi',
    description: '95% to\'ldi. Mashina yuborildi',
    time: '14:30',
    location: 'Amir Temur kochasi',
    binId: 'BIN-001'
  },
  { 
    id: 'ACT-002',
    type: 'success',
    title: 'Mashina #VH-001 yetib keldi',
    description: 'Quti #BIN-001 tozalandi',
    time: '14:35',
    location: 'Yakkasaroy',
    vehicleId: 'VH-001'
  },
  { 
    id: 'ACT-003',
    type: 'info',
    title: 'Yangi quti qo\'shildi',
    description: 'Quti #BIN-011 aktivlashtirildi',
    time: '14:40',
    location: 'Yunusobod',
    binId: 'BIN-011'
  },
  { 
    id: 'ACT-004',
    type: 'warning',
    title: 'Quti #BIN-008 ogohlantirish',
    description: '85% to\'ldi',
    time: '14:45',
    location: 'Chilonzor',
    binId: 'BIN-008'
  },
  { 
    id: 'ACT-005',
    type: 'danger',
    title: 'Sensor nosozligi',
    description: 'Quti #BIN-005 sensori ishlamayapti',
    time: '14:50',
    location: 'Yakkasaroy',
    binId: 'BIN-005'
  }
]

export const mockAlerts = [
  {
    id: 'ALERT-005',
    type: 'warning',
    title: 'Ogohlantirish darajasi',
    message: 'Quti #BIN-008 85% to\'ldi',
    time: '2 soat oldin',
    location: 'Mirzo Ulug\'bek',
    read: true,
    priority: 'medium'
  }
]

export const tashkentDistricts = {
  yakkasaroy: {
    center: [41.284, 69.279],
    bounds: [[41.27, 69.26], [41.29, 69.29]],
    bins: []
  },
  yunusobod: {
    center: [41.367, 69.292],
    bounds: [[41.35, 69.28], [41.38, 69.31]],
    bins: []
  },
  mirzo: {
    center: [41.314, 69.336],
    bounds: [[41.30, 69.32], [41.33, 69.35]],
    bins: []
  },
  chilonzor: {
    center: [41.286, 69.204],
    bounds: [[41.27, 69.19], [41.30, 69.22]],
    bins: []
  }
}

