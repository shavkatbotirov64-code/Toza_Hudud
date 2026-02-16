const { Client } = require('pg');
require('dotenv').config();

async function cleanBinsTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Database ga ulandi\n');

    // 1. Barcha eski ma'lumotlarni o'chirish
    console.log('🗑️ Eski ma\'lumotlarni o\'chirish...');
    await client.query('DELETE FROM bins WHERE "binId" IS NULL OR "binId" = \'\'');
    console.log('✅ NULL binId lar o\'chirildi');

    // 2. binId columnni NOT NULL qilish
    console.log('\n📝 binId columnni NOT NULL qilish...');
    try {
      await client.query(`
        ALTER TABLE bins 
        ALTER COLUMN "binId" SET NOT NULL;
      `);
      console.log('✅ binId column NOT NULL qilindi');
    } catch (error) {
      console.log('⚠️ binId allaqachon NOT NULL:', error.message);
    }

    // 3. code columnni nullable qilish (vaqtincha)
    console.log('\n📝 code columnni nullable qilish...');
    try {
      await client.query(`
        ALTER TABLE bins 
        ALTER COLUMN code DROP NOT NULL;
      `);
      console.log('✅ code column nullable qilindi');
    } catch (error) {
      console.log('⚠️ code allaqachon nullable:', error.message);
    }

    // 4. address columnni nullable qilish (vaqtincha)
    console.log('\n📝 address columnni nullable qilish...');
    try {
      await client.query(`
        ALTER TABLE bins 
        ALTER COLUMN address DROP NOT NULL;
      `);
      console.log('✅ address column nullable qilindi');
    } catch (error) {
      console.log('⚠️ address allaqachon nullable:', error.message);
    }

    // 5. Mavjud ma'lumotlarni yangilash - code va address ni to'ldirish
    console.log('\n🔄 Mavjud ma\'lumotlarni yangilash...');
    await client.query(`
      UPDATE bins 
      SET code = "binId", 
          address = location 
      WHERE code IS NULL OR address IS NULL;
    `);
    console.log('✅ Mavjud ma\'lumotlar yangilandi');

    // 6. Test quti yaratish/yangilash
    console.log('\n📦 Test quti yaratish...');
    const result = await client.query(`
      INSERT INTO bins (
        "binId",
        code,
        location,
        address,
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
        'ESP32-IBN-SINO',
        'Ibn Sino ko''chasi 17A, Samarqand',
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
        code = EXCLUDED.code,
        location = EXCLUDED.location,
        address = EXCLUDED.address,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        status = EXCLUDED.status,
        "fillLevel" = EXCLUDED."fillLevel",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING *;
    `);

    console.log('✅ Quti yaratildi/yangilandi:');
    console.log(`  - ID: ${result.rows[0].id}`);
    console.log(`  - binId: ${result.rows[0].binId}`);
    console.log(`  - code: ${result.rows[0].code}`);
    console.log(`  - location: ${result.rows[0].location}`);
    console.log(`  - status: ${result.rows[0].status}`);

    // 7. Barcha qutilarni ko'rish
    console.log('\n📋 Barcha qutilar:');
    const bins = await client.query('SELECT "binId", code, status, "fillLevel", location FROM bins');
    console.log(`Jami: ${bins.rows.length} ta quti`);
    bins.rows.forEach(bin => {
      console.log(`  - ${bin.binId} (${bin.code}): ${bin.status} (${bin.fillLevel}%) - ${bin.location}`);
    });

    console.log('\n✅ Database tozalandi va tuzatildi!');

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('\n🔌 Database ulanish yopildi');
  }
}

cleanBinsTable();
