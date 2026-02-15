# 🤖 TozaHudud Telegram Bot - O'rnatish va Ishga Tushirish

## 📋 Talablar

- Python 3.8+
- pip (Python package manager)
- Telegram Bot Token

## 🚀 O'rnatish

### 1. Virtual Environment yaratish (tavsiya etiladi)
```bash
cd TozaHudud_AI-bot
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Dependencies o'rnatish
```bash
pip install -r requirements.txt
```

### 3. Environment o'rnatish
`.env` faylida bot token va admin ID'larni tekshiring:
```env
BOT_TOKEN=7734947131:AAGL8wKpmHDY6tHFjZ9zOAI-T_3yCRoQmPI
ADMIN_ID=7377275622, 1039880863, 623785676,
```

### 4. Botni ishga tushirish
```bash
python bot.py
```

## 📊 Ma'lumotlar Bazasi

Bot SQLite ma'lumotlar bazasidan foydalanadi:
- **Fayl**: `tozahudud.db`
- **Jadvallar**: users, problems, subscribers, ratings, feedbacks
- **Statistika**: `stats.json` faylida saqlanadi

## 🔗 Web Dashboard bilan Integratsiya

### Variant 1: PostgreSQL ga ko'chirish
```bash
# Migration skriptini ishga tushirish
python migrate_to_postgres.py
```

### Variant 2: Backend API orqali
Backend serveri bot ma'lumotlarini SQLite dan o'qiydi va API orqali taqdim etadi.

## 🎯 Bot Funksiyalari

### Foydalanuvchilar uchun:
- ✅ Ro'yxatdan o'tish (ism + telefon)
- 📝 Murojaat yuborish (matn + media + lokatsiya)
- 📊 Holat tekshirish
- ⭐ Baholash (1-5 yulduz)
- 💬 Fikr bildirish

### Adminlar uchun:
- 📈 Statistika ko'rish
- 📋 Murojaatlarni ko'rish
- 💭 Fikrlarni o'qish
- 🔄 Holat yangilash

## 🛠 Texnik Ma'lumotlar

### Arxitektura:
```
Bot (Python) → SQLite → Backend API → Frontend Dashboard
```

### API Endpointlar:
- `GET /api/telegram/stats` - Statistika
- `GET /api/telegram/reports` - Murojaatlar
- `GET /api/telegram/feedbacks` - Fikrlar
- `GET /api/telegram/users` - Foydalanuvchilar

### Database Schema:
```sql
users (user_id, name, phone, created_at)
problems (id, user_id, description, media_type, file_id, lat, lon, status, created_at)
subscribers (user_id, created_at)
ratings (id, user_id, rating, created_at)
feedbacks (id, user_id, text, created_at)
```

## 🔧 Sozlamalar

### Bot Commands:
- `/start` - Botni ishga tushirish
- `/admin` - Admin panel (faqat adminlar uchun)
- `/cancel` - Jarayonni bekor qilish

### Admin ID'lar:
`.env` faylida `ADMIN_ID` qatoriga vergul bilan ajratilgan ID'larni qo'shing.

### Webhook (ixtiyoriy):
```bash
# Webhook o'rnatish
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://yourdomain.com/webhook"}'
```

## 📱 Foydalanish

1. **Telegram'da botni toping**: @tozahudud_bot
2. **Start bosing**: `/start`
3. **Ro'yxatdan o'ting**: Ism va telefon raqam
4. **Xizmatlardan foydalaning**: Murojaat, baholash, fikr

## 🐛 Muammolarni Hal Qilish

### Bot javob bermayapti:
- Bot token to'g'riligini tekshiring
- Internet ulanishini tekshiring
- Log faylini ko'ring: `bot.log`

### Ma'lumotlar saqlanmayapti:
- SQLite fayli mavjudligini tekshiring
- Fayl ruxsatlarini tekshiring
- Database initialization loglarini ko'ring

### Admin panel ishlamayapti:
- Admin ID to'g'riligini tekshiring
- `.env` faylida vergul bilan ajratilganligini tekshiring

## 📞 Yordam

Muammolar yuzaga kelsa:
1. `bot.log` faylini tekshiring
2. Console outputni ko'ring
3. Database faylini tekshiring
4. Bot token va admin ID'larni qayta tekshiring

## 🔄 Yangilanishlar

Bot kodi yangilanganda:
1. Botni to'xtating (Ctrl+C)
2. Yangi kodni tortib oling
3. Dependencies yangilang: `pip install -r requirements.txt`
4. Botni qayta ishga tushiring: `python bot.py`