// VEH-002 ni backend'da yaratish
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

async function createVEH002() {
  console.log('🚛 Creating VEH-002 in backend...\n');

  try {
    const response = await fetch(`${API_URL}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: 'VEH-002',
        driver: 'Aziz Karimov',
        phone: '+998 91 234 56 78',
        licensePlate: 'UZ-002',
        latitude: 39.6650,
        longitude: 66.9750
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ VEH-002 created successfully:', data.data);
    } else {
      console.log('❌ Failed to create VEH-002:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createVEH002();
