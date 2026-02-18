// Mashinalarning holatini reset qilish
const API_URL = 'https://tozahudud-production-d73f.up.railway.app';

const VEHICLES = ['VEH-001', 'VEH-002'];

async function resetState() {
  console.log('🔄 Resetting vehicle states...\n');

  for (const vehicleId of VEHICLES) {
    try {
      console.log(`🔄 Resetting ${vehicleId} state...`);
      
      const response = await fetch(`${API_URL}/vehicles/${vehicleId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPatrolling: true,
          hasCleanedOnce: false,
          patrolIndex: 0,
          status: 'moving',
          patrolRoute: [],
          currentRoute: null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${vehicleId} state reset successfully`);
      } else {
        console.log(`❌ Failed to reset ${vehicleId}: ${data.error}`);
      }
    } catch (error) {
      console.error(`❌ Error resetting ${vehicleId}:`, error.message);
    }
  }

  console.log('\n✅ All states reset!');
  console.log('📝 Vehicles are now patrolling from Samarqand center');
}

resetState();
