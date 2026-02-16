// Mock data for the application
export const mockBins = [
  { 
    id: 'BIN-001', 
    address: 'Registon ko\'chasi 15, Samarqand', 
    district: 'samarqand',
    location: [39.6550, 66.9750],
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
    address: 'Amir Temur ko\'chasi 45, Samarqand', 
    district: 'samarqand',
    location: [39.6400, 66.9800],
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
    address: 'Mirzo Ulug\'bek ko\'chasi 78, Samarqand', 
    district: 'samarqand',
    location: [39.6300, 66.9700],
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
    address: 'Shohruh ko\'chasi 12, Samarqand', 
    district: 'samarqand',
    location: [39.6200, 66.9650],
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
    address: 'Navoi ko\'chasi 89, Samarqand', 
    district: 'samarqand',
    location: [39.6600, 66.9850],
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
    address: 'Bobur ko\'chasi 56, Samarqand', 
    district: 'samarqand',
    location: [39.6350, 66.9900],
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
    address: 'Ahmad Donish ko\'chasi 90, Samarqand', 
    district: 'samarqand',
    location: [39.6450, 66.9600],
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
    address: 'Furqat ko\'chasi 34, Samarqand', 
    district: 'samarqand',
    location: [39.6150, 66.9550],
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
    address: 'Beruniy ko\'chasi 67, Samarqand', 
    district: 'samarqand',
    location: [39.6500, 66.9500],
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
    address: 'Alisher Navoiy ko\'chasi 21, Samarqand', 
    district: 'samarqand',
    location: [39.6250, 66.9950],
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
    location: 'Registon ko\'chasi, Samarqand',
    coordinates: [39.6550, 66.9750],
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
    location: 'Amir Temur ko\'chasi, Samarqand',
    coordinates: [39.6400, 66.9800],
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
    location: 'Shohruh ko\'chasi, Samarqand',
    coordinates: [39.6200, 66.9650],
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
    location: 'Mirzo Ulug\'bek ko\'chasi, Samarqand',
    coordinates: [39.6300, 66.9700],
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
    location: 'Registon ko\'chasi',
    binId: 'BIN-001'
  },
  { 
    id: 'ACT-002',
    type: 'success',
    title: 'Mashina #VH-001 yetib keldi',
    description: 'Quti #BIN-001 tozalandi',
    time: '14:35',
    location: 'Samarqand shahri',
    vehicleId: 'VH-001'
  },
  { 
    id: 'ACT-003',
    type: 'info',
    title: 'Yangi quti qo\'shildi',
    description: 'Quti #BIN-011 aktivlashtirildi',
    time: '14:40',
    location: 'Samarqand shahri',
    binId: 'BIN-011'
  },
  { 
    id: 'ACT-004',
    type: 'warning',
    title: 'Quti #BIN-008 ogohlantirish',
    description: '85% to\'ldi',
    time: '14:45',
    location: 'Furqat ko\'chasi',
    binId: 'BIN-008'
  },
  { 
    id: 'ACT-005',
    type: 'danger',
    title: 'Sensor nosozligi',
    description: 'Quti #BIN-005 sensori ishlamayapti',
    time: '14:50',
    location: 'Navoi ko\'chasi',
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
    location: 'Samarqand shahri',
    read: true,
    priority: 'medium'
  }
]

export const samarqandDistricts = {
  samarqand: {
    center: [39.6270, 66.9750],
    bounds: [[39.60, 66.95], [39.68, 67.00]],
    bins: []
  }
}

