// Mashinalarni quti yoniga qaytarish
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

// Quti pozitsiyasi
const BIN_LOCATION = [39.6742637, 66.9737814];

// Mashinalarni quti atrofiga joylashtirish
const VEHICLE_POSITIONS = {
  'VEH-001': [BIN_LOCATION[0] + 0.002, BIN_LOCATION[1] - 0.002], // Qutidan 200m janubi-sharqda
  'VEH-002': [BIN_LOCATION[0] - 0.002, BIN_LOCATION[1] + 0.002]  // Qutidan 200m shimoli-g'arbda
};

async function resetToBin() {
  console.log('🔧 Resetting vehicles to bin area...\n');
  console.log(`📍 Bin location: [${BIN_LOCATION[0]}, ${BIN_LOCATION[1]}]\n`);

  for (const [vehicleId, position] of Object.entries(VEHICLE_POSITIONS)) {
    try {
      console.log(`🚛 ${vehicleId}: Setting position to [${position[0]}, ${position[1]}]...`);
      
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: position[0],
          longitude: position[1]
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${vehicleId} updated successfully`);
      } else {
        console.log(`❌ ${vehicleId} update failed:`, data.error);
      }
      
    } catch (error) {
      console.error(`❌ Error updating ${vehicleId}:`, error.message);
    }
    
    console.log('');
  }
  
  console.log('✅ All vehicles reset to bin area!');
}

resetToBin();
