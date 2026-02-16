const { Client } = require('pg');
require('dotenv').config();

async function fixDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Database ga ulandi');

    // 1. Status columnni varchar ga o'zgartirish
    console.log('\n📝 Status columnni varchar ga o\'zgartirish...');
    try {
      await client.query(`
        ALTER TABLE bins 
        ALTER COLUMN status TYPE varchar(20);
      `);
      console.log('✅ Status column varchar ga o\'zgartirildi');
    } catch (error) {
      console.log('⚠️ Status column allaqachon varchar:', error.message);
    }

    // 1.5. Type columnni ham varchar ga o'zgartirish
    console.log('\n📝 Type columnni varchar ga o\'zgartirish...');
    try {
      await client.query(`
        ALTER TABLE bins 
        ALTER COLUMN type TYPE varchar(50);
      `);
      console.log('✅ Type column varchar ga o\'zgartirildi');
    } catch (error) {
      console.log('⚠️ Type column allaqachon varchar:', error.message);
    }

    // 2. Eski enum turlarini o'chirish
    console.log('\n🗑️ Eski enum turlarini o\'chirish...');
    try {
      await client.query(`DROP TYPE IF EXISTS bins_status_enum CASCADE;`);
      console.log('✅ bins_status_enum o\'chirildi');
    } catch (error) {
      console.log('⚠️ bins_status_enum topilmadi:', error.message);
    }
    
    try {
      await client.query(`DROP TYPE IF EXISTS bins_type_enum CASCADE;`);
      console.log('✅ bins_type_enum o\'chirildi');
    } catch (error) {
      console.log('⚠️ bins_type_enum topilmadi:', error.message);
    }

    // 3. Test quti yaratish
    console.log('\n📦 Test quti yaratish...');
    const result = await client.query(`
      INSERT INTO bins (
        "binId",
        location,
        district,
        latitude,
        longitude,
        status,
        "fillLevel",
        capacity,
        type,
        "isOnline",
        "batteryLevel",
        "isActive"
      ) VALUES (
        'ESP32-IBN-SINO',
        'Ibn Sino ko''chasi 17A, Samarqand',
        'Samarqand',
        39.6742637,
        66.9737814,
        'EMPTY',
        15,
        120,
        'standard',
        true,
        100,
        true
      )
      ON CONFLICT ("binId") DO UPDATE SET
        location = EXCLUDED.location,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        status = EXCLUDED.status,
        "fillLevel" = EXCLUDED."fillLevel",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *;
    `);

    console.log('✅ Quti yaratildi/yangilandi:');
    console.log(result.rows[0]);

    // 4. Barcha qutilarni ko'rish
    console.log('\n📋 Barcha qutilar:');
    const bins = await client.query('SELECT * FROM bins');
    console.log(`Jami: ${bins.rows.length} ta quti`);
    bins.rows.forEach(bin => {
      console.log(`  - ${bin.binId}: ${bin.status} (${bin.fillLevel}%) - ${bin.location}`);
    });

    console.log('\n✅ Database tuzatildi!');

  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database ulanish yopildi');
  }
}

fixDatabase();
