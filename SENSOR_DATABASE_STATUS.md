# ESP32 Sensor Ma'lumotlari - Database Holati

## Hozirgi Holat

✅ **JSON File ga saqlash** - ISHLAYAPTI
- Ma'lumotlar: `backend/sensor-data.json`
- Alertlar: `backend/sensor-alerts.json`
- Oxirgi 1000 ta o'lchash saqlanadi
- Oxirgi 500 ta alert saqlanadi

❌ **Database ga saqlash** - HALI YO'Q
- Entity'lar yaratildi:
  - `SensorReading` entity
  - `SensorAlert` entity
- Module yangilandi
- Service yangilanishi kerak

## Database Entity'lar

### SensorReading
```typescript
- id: UUID (primary key)
- distance: decimal(10,2)
- binId: string
- location: string
- isAlert: boolean
- timestamp: datetime (auto)
```

### SensorAlert
```typescript
- id: UUID (primary key)
- distance: decimal(10,2)
- binId: string
- location: string
- message: text
- status: enum('active', 'resolved')
- timestamp: datetime (auto)
- updatedAt: datetime (auto)
```

## Keyingi Qadamlar

Database ga saqlash uchun:

1. ✅ Entity'lar yaratildi
2. ✅ Module yangilandi
3. ⏳ Service ni yangilash kerak (TypeORM repository ishlatish)
4. ⏳ Migration yaratish
5. ⏳ Deploy qilish

## Hozirgi Ishlash

ESP32 dan kelgan ma'lumotlar:
1. ✅ Backend qabul qiladi (`/sensors/distance`)
2. ✅ JSON file ga saqlaydi
3. ✅ Frontend ko'rsatadi
4. ❌ Database ga saqlanmaydi (hali)

## Test Ma'lumotlar

Backend da test ma'lumotlar mavjud:
- 5.5 sm | ESP32-TEST-001
- 15.2 sm | ESP32-TEST-002
- 25.8 sm | ESP32-TEST-003
- 8.3 sm | ESP32-TEST-004
- 35.0 sm | ESP32-TEST-005

## Xulosa

Hozirda ESP32 ma'lumotlari **JSON file ga** saqlanmoqda va frontend da ko'rinmoqda. Database ga saqlash uchun service ni to'liq qayta yozish kerak, lekin bu hozirgi ishlashga ta'sir qilmaydi.

Agar database ga saqlash kerak bo'lsa, service ni yangilaymiz.
