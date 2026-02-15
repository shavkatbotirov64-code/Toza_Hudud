const axios = require('axios');

const API_BASE = 'http://localhost:3002/api';

// Demo vehicles data
const demoVehicles = [
  {
    plateNumber: '01A123BC',
    driverName: 'Aziz Karimov',
    type: 'truck',
    status: 'active',
    capacity: 5000,
    fuelLevel: 85,
    currentLocation: 'Chilonzor tumani',
    currentRoute: 'Marshrut #1 - Chilonzor',
    latitude: 41.2856,
    longitude: 69.2034
  },
  {
    plateNumber: '01B456DE',
    driverName: 'Bobur Alimov',
    type: 'truck',
    status: 'moving',
    capacity: 4500,
    fuelLevel: 72,
    currentLocation: 'Yunusobod tumani',
    currentRoute: 'Marshrut #2 - Yunusobod',
    latitude: 41.3156,
    longitude: 69.2456
  },
  {
    plateNumber: '01C789FG',
    driverName: 'Sardor Mirzaev',
    type: 'compactor',
    status: 'maintenance',
    capacity: 6000,
    fuelLevel: 45,
    currentLocation: 'Servis markazi',
    currentRoute: 'Ta\'mirlash',
    latitude: 41.2756,
    longitude: 69.2156
  },
  {
    plateNumber: '01D012HI',
    driverName: 'Jasur Nazarov',
    type: 'truck',
    status: 'active',
    capacity: 5500,
    fuelLevel: 90,
    currentLocation: 'Shayxontohur tumani',
    currentRoute: 'Marshrut #3 - Shayxontohur',
    latitude: 41.3056,
    longitude: 69.2756
  },
  {
    plateNumber: '01E345JK',
    driverName: 'Otabek Saidov',
    type: 'sweeper',
    status: 'inactive',
    capacity: 2000,
    fuelLevel: 60,
    currentLocation: 'Garage',
    currentRoute: 'Dam olish',
    latitude: 41.2956,
    longitude: 69.2356
  }
];

// Demo alerts data
const demoAlerts = [
  {
    title: 'Quti to\'la',
    message: 'BIN-001 qutisi 95% to\'lgan, tozalash kerak',
    severity: 'high',
    status: 'active',
    location: 'Amir Temur ko\'chasi',
    binId: null, // Will be set after creating bins
    vehicleId: null,
    latitude: 41.2995,
    longitude: 69.2401
  },
  {
    title: 'Transport vositasi buzilgan',
    message: '01C789FG raqamli mashina ta\'mirlashga muhtoj',
    severity: 'medium',
    status: 'acknowledged',
    location: 'Servis markazi',
    binId: null,
    vehicleId: null, // Will be set after creating vehicles
    latitude: 41.2756,
    longitude: 69.2156
  },
  {
    title: 'Sensor ishlamayapti',
    message: 'BIN-003 qutisining sensori javob bermayapti',
    severity: 'medium',
    status: 'active',
    location: 'Buyuk Ipak Yo\'li',
    binId: null,
    vehicleId: null,
    latitude: 41.3125,
    longitude: 69.2789
  },
  {
    title: 'Yoqilg\'i kam',
    message: '01B456DE mashina yoqilg\'isi 30% dan kam',
    severity: 'low',
    status: 'active',
    location: 'Yunusobod tumani',
    binId: null,
    vehicleId: null,
    latitude: 41.3156,
    longitude: 69.2456
  },
  {
    title: 'Marshrut yakunlandi',
    message: '01A123BC mashina marshrut #1 ni muvaffaqiyatli yakunladi',
    severity: 'low',
    status: 'resolved',
    location: 'Chilonzor tumani',
    binId: null,
    vehicleId: null,
    latitude: 41.2856,
    longitude: 69.2034
  }
];

async function createDemoData() {
  console.log('🚀 Demo ma\'lumotlar yaratilmoqda...');
  
  try {
    // Test API connection
    console.log('🔗 API ulanishini tekshirish...');
    const healthCheck = await axios.get(`${API_BASE}/health`);
    console.log('✅ API ulanishi muvaffaqiyatli');
    
    // Create demo vehicles
    console.log('🚛 Demo transport vositalarini yaratish...');
    const createdVehicles = [];
    
    for (const vehicle of demoVehicles) {
      try {
        const response = await axios.post(`${API_BASE}/vehicles`, vehicle);
        createdVehicles.push(response.data.data);
        console.log(`✅ Transport vositasi yaratildi: ${vehicle.plateNumber}`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`⚠️  Transport vositasi allaqachon mavjud: ${vehicle.plateNumber}`);
        } else {
          console.error(`❌ Transport vositasi yaratishda xatolik: ${vehicle.plateNumber}`, error.response?.data || error.message);
        }
      }
    }
    
    // Create demo alerts
    console.log('🚨 Demo ogohlantirishlarni yaratish...');
    const createdAlerts = [];
    
    for (const alert of demoAlerts) {
      try {
        const response = await axios.post(`${API_BASE}/alerts`, alert);
        createdAlerts.push(response.data.data);
        console.log(`✅ Ogohlantirish yaratildi: ${alert.title}`);
      } catch (error) {
        console.error(`❌ Ogohlantirish yaratishda xatolik: ${alert.title}`, error.response?.data || error.message);
      }
    }
    
    console.log('\\n📊 Yaratilgan ma\'lumotlar:');
    console.log(`🚛 Transport vositalari: ${createdVehicles.length} ta`);
    console.log(`🚨 Ogohlantirishlar: ${createdAlerts.length} ta`);
    console.log('\\n✅ Demo ma\'lumotlar muvaffaqiyatli yaratildi!');
    
  } catch (error) {
    console.error('❌ Demo ma\'lumotlar yaratishda xatolik:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the script
createDemoData();