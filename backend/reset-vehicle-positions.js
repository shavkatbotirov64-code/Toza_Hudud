const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Quti lokatsiyasi - Ibn Sino ko'chasi 17A
const BIN_LOCATION = {
  lat: 39.6742637,
  lon: 66.9737814
};

async function resetVehiclePositions() {
  try {
    console.log('🔄 Resetting vehicle positions to bin area...');
    
    // VEH-001: Qutidan 200m shimolda
    const veh001_lat = BIN_LOCATION.lat + 0.002; // ~200m shimol
    const veh001_lon = BIN_LOCATION.lon + 0.001; // ~100m sharq
    
    // VEH-002: Qutidan 200m janubda
    const veh002_lat = BIN_LOCATION.lat - 0.002; // ~200m janub
    const veh002_lon = BIN_LOCATION.lon - 0.001; // ~100m g'arb
    
    // VEH-001 ni yangilash
    await pool.query(`
      UPDATE vehicles
      SET 
        latitude = $1,
        longitude = $2,
        "isPatrolling" = true,
        "hasCleanedOnce" = false,
        "patrolIndex" = 0,
        "patrolRoute" = NULL,
        "currentRoute" = NULL,
        status = 'idle',
        "isMoving" = false,
        "targetBinId" = NULL,
        "updatedAt" = NOW()
      WHERE "vehicleId" = 'VEH-001'
    `, [veh001_lat, veh001_lon]);
    
    console.log(`✅ VEH-001 reset: [${veh001_lat}, ${veh001_lon}]`);
    
    // VEH-002 ni yangilash
    await pool.query(`
      UPDATE vehicles
      SET 
        latitude = $1,
        longitude = $2,
        "isPatrolling" = true,
        "hasCleanedOnce" = false,
        "patrolIndex" = 0,
        "patrolRoute" = NULL,
        "currentRoute" = NULL,
        status = 'idle',
        "isMoving" = false,
        "targetBinId" = NULL,
        "updatedAt" = NOW()
      WHERE "vehicleId" = 'VEH-002'
    `, [veh002_lat, veh002_lon]);
    
    console.log(`✅ VEH-002 reset: [${veh002_lat}, ${veh002_lon}]`);
    
    console.log('');
    console.log('📍 Bin location:', BIN_LOCATION);
    console.log('🚛 VEH-001: ~200m shimolda');
    console.log('🚛 VEH-002: ~200m janubda');
    console.log('');
    console.log('✅ All vehicles reset to bin area!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

resetVehiclePositions();
