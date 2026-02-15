# ESP32 Sensor Panel - Tezkor Yechim

## Muammo
Frontend yangi kod bilan deploy bo'lmayapti va eski backend URL ishlatmoqda.

## Yechim 1: Railway Dashboard (ENG OSON)

1. Brauzerda oching: https://railway.com/project/e0ee489f-1abf-4ca2-8a38-9eb343401483
2. Login qiling: saidkarimcyber01@gmail.com
3. `Toza_Hudud_frontend` service ni bosing
4. "Deployments" tabga o'ting  
5. Eng oxirgi deployment ni toping
6. "..." (3 nuqta) tugmasini bosing
7. "Redeploy" ni tanlang
8. 2-3 daqiqa kuting

## Yechim 2: Terminal (HOZIR)

```bash
cd frontend
railway link
# "Toza_Hudud_frontend" ni tanlang
railway up --detach
```

## Yechim 3: Vaqtinchalik (Agar deploy ishlamasa)

Eski backend URL ni ishlatish uchun eski backend ni qayta ishga tushiring yoki yangi backend URL ni kutamiz.

## Tekshirish

Deploy tugagandan keyin:
1. Brauzerda: https://tozahududfrontend-production.up.railway.app
2. Ctrl+Shift+R bosing (hard refresh)
3. F12 bosing va Console tabni oching
4. Quyidagi loglarni ko'rishingiz kerak:
   - `🔍 Fetching sensor data from: https://tozahudud-production-d73f.up.railway.app/sensors/latest`
   - `✅ Sensor data received`

## Agar hali ham ishlamasa

Backend loglarini tekshiring:
```bash
cd backend
railway logs
```

ESP32 dan ma'lumot kelyaptimi:
- `📡 ESP32 dan ma'lumot keldi`
- `✅ Sensor data saved`

## Oxirgi chora

Agar hech narsa ishlamasa, local da test qiling:
```bash
cd frontend
npm install
npm run dev
```

Keyin brauzerda: http://localhost:5173
