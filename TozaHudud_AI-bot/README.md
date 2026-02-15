# 🤖 TozaHudud AI Bot

Telegram bot fuqarolar uchun - axlat to'plash muammolarini xabar qilish va fikr bildirish.

## 📋 Xususiyatlar

- ✅ Fuqarolardan murojaat qabul qilish
- ✅ Geolokatsiya bilan xabar yuborish
- ✅ Rasm yuklash imkoniyati
- ✅ Fikr-mulohaza to'plash
- ✅ Admin panel bilan integratsiya
- ✅ PostgreSQL database
- ✅ Async/await architecture
- ✅ Error handling va logging

## 🚀 O'rnatish

### Prerequisites

- Python 3.11+
- PostgreSQL database
- Telegram Bot Token

### Local Development

```bash
# Virtual environment yaratish
python -m venv venv

# Activate
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Dependencies o'rnatish
pip install -r requirements.txt

# .env fayl yaratish
cp .env.example .env
# .env faylni to'ldiring

# Bot ishga tushirish
python bot.py
```

## 🔧 Configuration

### .env File

```env
# Telegram Bot
BOT_TOKEN=your_telegram_bot_token_here

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=smart_trash_db

# Settings
LOG_LEVEL=INFO
```

### Telegram Bot Token Olish

1. Telegram'da @BotFather ga yozing
2. `/newbot` buyrug'ini yuboring
3. Bot nomi va username kiriting
4. Token oling va .env ga qo'shing

## 📱 Bot Commands

### Foydalanuvchi Buyruqlari

- `/start` - Botni ishga tushirish
- `/report` - Murojaat yuborish
- `/feedback` - Fikr bildirish
- `/status` - Tizim holati
- `/help` - Yordam

### Admin Buyruqlari

- `/stats` - Statistika
- `/broadcast` - Ommaviy xabar
- `/users` - Foydalanuvchilar ro'yxati

## 🗄️ Database Schema

### telegram_users
```sql
- user_id (BIGINT, PRIMARY KEY)
- username (VARCHAR)
- first_name (VARCHAR)
- last_name (VARCHAR)
- phone_number (VARCHAR)
- created_at (TIMESTAMP)
- is_active (BOOLEAN)
```

### telegram_reports
```sql
- id (UUID, PRIMARY KEY)
- user_id (BIGINT, FOREIGN KEY)
- message (TEXT)
- location (VARCHAR)
- latitude (DECIMAL)
- longitude (DECIMAL)
- photo_url (VARCHAR)
- status (VARCHAR)
- created_at (TIMESTAMP)
```

### telegram_feedbacks
```sql
- id (UUID, PRIMARY KEY)
- user_id (BIGINT, FOREIGN KEY)
- message (TEXT)
- rating (INTEGER)
- created_at (TIMESTAMP)
```

## 🚀 Deployment

### Railway Deployment

```bash
# Dockerfile yaratish kerak
# Railway'da yangi service qo'shish
# Environment variables sozlash
# Deploy
```

### VPS Deployment

```bash
# Server'ga clone qilish
git clone <repo-url>
cd TozaHudud_AI-bot

# Dependencies
pip install -r requirements.txt

# Systemd service yaratish
sudo nano /etc/systemd/system/tozahudud-bot.service
```

**Service file:**
```ini
[Unit]
Description=TozaHudud Telegram Bot
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/TozaHudud_AI-bot
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/python bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Service'ni yoqish
sudo systemctl enable tozahudud-bot
sudo systemctl start tozahudud-bot
sudo systemctl status tozahudud-bot
```

## 🔍 Monitoring

### Logs

```bash
# Bot logs
tail -f bot.log

# Systemd logs
sudo journalctl -u tozahudud-bot -f
```

### Health Check

```python
# Bot status tekshirish
python check_bot_status.py
```

## 🛠️ Development

### Project Structure

```
TozaHudud_AI-bot/
├── bot.py                 # Main bot file
├── database.py            # SQLite database (deprecated)
├── database_pg.py         # PostgreSQL database
├── requirements.txt       # Dependencies
├── .env                   # Environment variables
├── .env.example          # Example env file
├── README.md             # This file
└── utils/                # Helper functions
```

### Adding New Features

```python
# bot.py da yangi handler qo'shish
@bot.message_handler(commands=['newcommand'])
def handle_new_command(message):
    # Your code here
    pass
```

## 🧪 Testing

```bash
# Test foydalanuvchi qo'shish
python add_test_user.py

# Test murojaat yuborish
python add_test_feedbacks.py

# Database tekshirish
python check_database.py
```

## 📊 Statistics

Bot statistikasi admin panel orqali ko'rish mumkin:
- Jami foydalanuvchilar
- Kunlik murojaatlar
- Fikr-mulohazalar
- Faol foydalanuvchilar

## 🔐 Security

- Bot token xavfsiz saqlang
- Database credentials .env da
- .env faylni git'ga commit qilmang
- Admin buyruqlarini himoyalang
- User input validation qiling

## 🤝 Contributing

1. Fork repository
2. Feature branch yarating
3. Commit qiling
4. Push qiling
5. Pull Request oching

## 📝 License

MIT License

## 📞 Support

- Issues: GitHub Issues
- Email: support@tozahudud.uz
- Telegram: @TozaHududSupport

---

Made with ❤️ for cleaner cities
