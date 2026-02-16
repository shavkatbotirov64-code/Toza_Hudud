const { Client } = require('pg');
require('dotenv').config();

async function createActivitiesTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Database connected');

    // Activities jadvalini yaratish
    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        "binId" VARCHAR(50),
        "vehicleId" VARCHAR(50),
        location VARCHAR(200) NOT NULL,
        time VARCHAR(10) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Activities table created');

    // Test ma'lumotlar qo'shish
    const testActivities = [
      {
        type: 'bin_full',
        title: 'Quti #ESP32-IBN-SINO to\'ldi',
        description: '95% to\'ldi. Mashina yuborildi',
        binId: 'ESP32-IBN-SINO',
        location: 'Ibn Sino ko\'chasi 17A, Samarqand',
        time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
      },
      {
        type: 'vehicle_arrived',
        title: 'Mashina #VEH-001 yetib keldi',
        description: 'Quti #ESP32-IBN-SINO tozalanmoqda',
        vehicleId: 'VEH-001',
        binId: 'ESP32-IBN-SINO',
        location: 'Ibn Sino ko\'chasi 17A, Samarqand',
        time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
      },
      {
        type: 'bin_cleaned',
        title: 'Quti #ESP32-IBN-SINO tozalandi',
        description: 'Quti bo\'sh holatga keltirildi',
        binId: 'ESP32-IBN-SINO',
        location: 'Ibn Sino ko\'chasi 17A, Samarqand',
        time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
      }
    ];

    for (const activity of testActivities) {
      await client.query(`
        INSERT INTO activities (type, title, description, "binId", "vehicleId", location, time)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        activity.type,
        activity.title,
        activity.description,
        activity.binId || null,
        activity.vehicleId || null,
        activity.location,
        activity.time
      ]);
      
      console.log(`✅ Test activity added: ${activity.title}`);
    }

    // Verify
    const result = await client.query('SELECT * FROM activities ORDER BY "createdAt" DESC LIMIT 5');
    console.log('\n📊 Recent activities:');
    result.rows.forEach(a => {
      console.log(`   ${a.time} - ${a.title}`);
    });

    console.log('\n✅ Activities table ready!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

createActivitiesTable();
