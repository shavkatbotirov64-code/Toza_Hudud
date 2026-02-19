const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function resetVehicleStates() {
  try {
    console.log('🔄 Resetting vehicle states...');
    
    // Reset all vehicles to patrol mode
    const result = await pool.query(`
      UPDATE vehicles
      SET 
        "isPatrolling" = true,
        "hasCleanedOnce" = false,
        "patrolIndex" = 0,
        "patrolRoute" = NULL,
        "currentRoute" = NULL,
        status = 'idle',
        "isMoving" = false,
        "targetBinId" = NULL
      WHERE "vehicleId" IN ('VEH-001', 'VEH-002')
      RETURNING "vehicleId", "isPatrolling", "hasCleanedOnce", status
    `);
    
    console.log('✅ Vehicle states reset successfully!');
    console.log('📊 Updated vehicles:', result.rows);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

resetVehicleStates();
