-- Database'dagi eski enum turini o'chirish va status columnni varchar ga o'zgartirish

-- 1. Agar bins jadvali mavjud bo'lsa, status columnni varchar ga o'zgartirish
ALTER TABLE bins 
ALTER COLUMN status TYPE varchar(20);

-- 2. Eski enum turini o'chirish (agar mavjud bo'lsa)
DROP TYPE IF EXISTS bins_status_enum CASCADE;

-- 3. Test quti yaratish
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
  "updatedAt" = CURRENT_TIMESTAMP;

-- 4. Natijani ko'rish
SELECT * FROM bins WHERE "binId" = 'ESP32-IBN-SINO';
