// Test script for creating demo alerts
const API_BASE = 'http://localhost:3002/api';

// Demo alerts data
const demoAlerts = [
  {
    title: 'Quti to\'la',
    message: 'BIN-001 qutisi 95% to\'lgan, tozalash kerak',
    type: 'bin_full',
    severity: 'high',
    location: 'Amir Temur ko\'chasi',
    latitude: 41.2995,
    longitude: 69.2401
  },
  {
    title: 'Transport vositasi buzilgan',
    message: '01C789FG raqamli mashina ta\'mirlashga muhtoj',
    type: 'vehicle_breakdown',
    severity: 'medium',
    location: 'Servis markazi',
    latitude: 41.2756,
    longitude: 69.2156
  },
  {
    title: 'Sensor ishlamayapti',
    message: 'BIN-003 qutisining sensori javob bermayapti',
    type: 'sensor_offline',
    severity: 'medium',
    location: 'Buyuk Ipak Yo\'li',
    latitude: 41.3156,
    longitude: 69.2756
  },
  {
    title: 'Batareya quvvati kam',
    message: 'BIN-005 sensori batareyasi 15% qolgan',
    type: 'battery_low',
    severity: 'low',
    location: 'Mustaqillik maydoni',
    latitude: 41.2856,
    longitude: 69.2456
  },
  {
    title: 'Kritik holat',
    message: 'BIN-007 qutisi toshib ketgan, zudlik bilan tozalash kerak!',
    type: 'bin_overflow',
    severity: 'critical',
    location: 'Chorsu bozori',
    latitude: 41.3256,
    longitude: 69.2656
  }
];

async function createAlerts() {
  console.log('🚨 Demo alertlar yaratilmoqda...');
  
  for (const alert of demoAlerts) {
    try {
      const response = await fetch(`${API_BASE}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Alert yaratildi: ${alert.title}`);
      } else {
        console.error(`❌ Alert yaratishda xatolik: ${alert.title}`, response.status);
      }
    } catch (error) {
      console.error(`❌ Xatolik: ${alert.title}`, error.message);
    }
  }
  
  console.log('🎉 Demo alertlar yaratish tugadi!');
}

// Test API connection first
async function testConnection() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (response.ok) {
      console.log('✅ API ulanishi muvaffaqiyatli');
      return true;
    } else {
      console.error('❌ API javob bermayapti');
      return false;
    }
  } catch (error) {
    console.error('❌ API ga ulanib bo\'lmadi:', error.message);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  if (connected) {
    await createAlerts();
  } else {
    console.log('❌ API ishlamayapti. Docker containerlarni tekshiring.');
  }
}

main();