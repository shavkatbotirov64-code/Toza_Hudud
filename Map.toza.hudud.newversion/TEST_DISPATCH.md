# Test Dispatch - Mashinani Avtomatik Yuborish

## Muammo 1: Mashina Yuborilmayapti ✅ HAL QILINDI
Quti qizil bo'lganda mashina avtomatik yuborilmayapti.

### Tuzatish
VERSION 5.0 FIXED - `hasCleanedOnce` tekshiruvini olib tashladik.

## Muammo 2: Quti Yashil Bo'lmayapti ✅ HAL QILINDI
Mashina tozalagandan keyin quti yashil rangga o'tmayapti haydovchi panelida.

### Tuzatish
`AppContext.tsx` dagi polling logikasini tuzatdik:
- Eski: Faqat `FULL → EMPTY` o'zgarishini tekshirardi
- Yangi: Backend'dan kelgan fillLevel ga qarab har doim yangilaydi
- Agar fillLevel < 90 → EMPTY (yashil)
- Agar fillLevel >= 90 → FULL (qizil)

## Test Qilish

### 1. LocalStorage'ni Tozalash
Browser console'da ishga tushiring:
```javascript
localStorage.removeItem('newMapVehiclesData');
location.reload();
```

### 2. Qutini To'ldirish (Qizilga O'zgartirish)
```bash
cd Map.toza.hudud.newversion
node fill-bin.js
```

Natija:
- ✅ Quti qizil bo'ladi (fillLevel = 95%)
- ✅ Eng yaqin mashina avtomatik yuboriladi
- ✅ Mashina qutiga boradi va tozalaydi
- ✅ Backend fillLevel'ni 15 ga o'zgartiradi
- ✅ Quti yashil bo'ladi (fillLevel = 15%) - YANGI TUZATISH!

### 3. Qayta Test Qilish
```bash
node fill-bin.js
```

Natija:
- ✅ Quti yana qizil bo'ladi
- ✅ Boshqa mashina yuboriladi (eng yaqini)
- ✅ Tozalagandan keyin yana yashil bo'ladi
- ✅ Har safar ishlashi kerak!

## Console Loglari

Qidirilayotgan loglar:

### Dispatch (Yuborish)
```
🔍 [VERSION 5.0 FIXED] Checking bin status: FULL
🚛 Bin is FULL! Finding closest vehicle...
🔍 Patrolling vehicles: ['NEWMAP-VEH-001', 'NEWMAP-VEH-002']
✅ Closest vehicle: NEWMAP-VEH-001 (1.23 km)
🚀 Dispatching NEWMAP-VEH-001 to bin...
📍 Route created with 150 points
✅ NEWMAP-VEH-001 dispatched successfully!
```

### Tozalash (Cleaning)
```
✅ NEWMAP-VEH-001 reached bin!
🧹 Cleaning started!
✅ Tozalash yozuvi yaratildi
✅ Backend qutini tozaladi va fillLevel 15 ga o'zgartiradi
🟢 Updating frontend bin status to EMPTY
✅ Bin status updated in frontend
```

### Polling (Yangilanish)
```
🔄 Loading data from backend...
📦 Raw bins from backend: [{"fillLevel": 15, ...}]
🔍 First bin fillLevel FROM BACKEND: 15
🟢 Bin is EMPTY! Setting binStatus to EMPTY
```

## Agar Ishlamasa

1. Browser cache'ni tozalash: Ctrl+Shift+R
2. Console'da xatoliklarni tekshirish
3. Backend'ni tekshirish: https://tozahudud-production-d73f.up.railway.app/bins
4. VERSION 5.0 FIXED ko'rinishini tekshirish console'da
5. Polling loglarini tekshirish (har 5 soniyada)

## Qutini Tozalash (Manual)
```bash
node clean-bin.js
```

## Farqi: Admin Panel vs Haydovchi Panel

- Admin Panel: Alohida kod, alohida logika (tegmadik)
- Haydovchi Panel: `Map.toza.hudud.newversion` - TUZATILDI ✅
- Ikkala panel ham bir xil backend'dan ma'lumot oladi
- Endi ikkala panelda ham quti rangi to'g'ri ishlaydi
