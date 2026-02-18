// VEH-002 ni backend'da to'g'ri yaratish
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

async function fixVEH002() {
  console.log('🔧 Fixing VEH-002...\n');

  try {
    // Upsert VEH-002
    const response = await fetch(`${API_URL}/vehicles/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: 'VEH-002',
        driver: 'Aziz Karimov',
        latitude: 39.6650,
        longitude: 66.9750,
        status: 'moving'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ VEH-002 created/updated:', data.data);
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixVEH002();
