const { Client } = require('pg');
require('dotenv').config();

async function createTestVehicles() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Database connected');

    // Check if vehicles table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'vehicles'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ Vehicles table does not exist. Creating...');
      
      await client.query(`
        CREATE TABLE vehicles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "vehicleId" VARCHAR(50) UNIQUE NOT NULL,
          driver VARCHAR(100) NOT NULL,
          latitude DECIMAL(10, 7) NOT NULL,
          longitude DECIMAL(10, 7) NOT NULL,
          status VARCHAR(20) DEFAULT 'idle',
          "isMoving" BOOLEAN DEFAULT false,
          "targetBinId" VARCHAR(50),
          "lastCleaningTime" TIMESTAMP,
          "totalCleanings" INTEGER DEFAULT 0,
          "totalDistanceTraveled" DECIMAL(10, 2) DEFAULT 0,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      
      console.log('✅ Vehicles table created');
    }

    // Check if vehicles already exist
    const existingVehicles = await client.query('SELECT * FROM vehicles');
    console.log(`📊 Existing vehicles: ${existingVehicles.rows.length}`);

    if (existingVehicles.rows.length > 0) {
      console.log('⚠️ Vehicles already exist:');
      existingVehicles.rows.forEach(v => {
        console.log(`   - ${v.vehicleId}: ${v.driver}`);
      });
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('Delete existing vehicles and create new ones? (yes/no): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Cancelled');
        await client.end();
        return;
      }
      
      await client.query('DELETE FROM vehicles');
      console.log('🗑️ Existing vehicles deleted');
    }

    // Create test vehicles
    const vehicles = [
      {
        vehicleId: 'VEH-001',
        driver: 'Akmaljon Karimov',
        latitude: 39.6650,
        longitude: 66.9600,
        status: 'idle',
        isMoving: false
      },
      {
        vehicleId: 'VEH-002',
        driver: 'Sardor Rahimov',
        latitude: 39.6780,
        longitude: 66.9850,
        status: 'idle',
        isMoving: false
      }
    ];

    for (const vehicle of vehicles) {
      await client.query(`
        INSERT INTO vehicles ("vehicleId", driver, latitude, longitude, status, "isMoving")
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        vehicle.vehicleId,
        vehicle.driver,
        vehicle.latitude,
        vehicle.longitude,
        vehicle.status,
        vehicle.isMoving
      ]);
      
      console.log(`✅ Created vehicle: ${vehicle.vehicleId} - ${vehicle.driver}`);
    }

    // Verify
    const result = await client.query('SELECT * FROM vehicles ORDER BY "createdAt" DESC');
    console.log('\n📊 Vehicles in database:');
    result.rows.forEach(v => {
      console.log(`   ${v.vehicleId}: ${v.driver} at [${v.latitude}, ${v.longitude}]`);
    });

    console.log('\n✅ Test vehicles created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

createTestVehicles();
