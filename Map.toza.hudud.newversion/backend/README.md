# New Map Backend

Yangi xarita uchun alohida backend - mashina dispatch xizmati.

## Xususiyatlar

- ✅ Eng yaqin mashinani topish
- ✅ Mashinani qutiga yo'naltirish
- ✅ OSRM API bilan real yo'llar
- ✅ Masofa va vaqt hisoblash

## O'rnatish

```bash
npm install
```

## Ishga tushirish

```bash
# Development
npm run dev

# Production
npm start
```

## Endpoints

### Health Check
```
GET /health
```

### Eng yaqin mashinani topish
```
POST /dispatch/find-closest
Body: {
  "binLocation": [39.6742637, 66.9737814],
  "vehicles": [
    {
      "id": "NEWMAP-VEH-001",
      "driver": "Driver 1",
      "position": [39.6650, 66.9600],
      "isPatrolling": true
    }
  ]
}
```

### Mashinani qutiga yo'naltirish
```
POST /dispatch/send-to-bin
Body: {
  "binId": "ESP32-IBN-SINO",
  "binLocation": [39.6742637, 66.9737814],
  "binAddress": "Ibn Sino ko'chasi 17A",
  "vehicles": [...]
}
```

## Port

Default: `3003`

`.env` faylida o'zgartirish mumkin.
