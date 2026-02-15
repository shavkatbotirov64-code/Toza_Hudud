# 🗑️ Toza Hudud - Smart Trash Management System

Aqlli axlat boshqaruv tizimi - IoT sensorlar, real-time monitoring va Telegram bot integratsiyasi bilan.

## 📋 Loyiha Haqida

Toza Hudud - bu zamonaviy axlat boshqaruv tizimi bo'lib, quyidagi imkoniyatlarni taqdim etadi:
- Real-time axlat qutilari monitoringi
- GPS orqali transport vositalari kuzatuvi
- Telegram bot orqali fuqarolar bilan aloqa
- Marshrut optimizatsiyasi
- Statistika va hisobotlar
- Ogohlantirish tizimi

## 🏗️ Arxitektura

```
Toza_Hudud/
├── backend/              # NestJS API (PostgreSQL)
├── frontend/             # React Admin Panel
├── TozaHudud_AI-bot/    # Telegram Bot (Python)
└── docker-compose.yml    # Local development
```

## 🚀 Deployment (Railway)

Loyiha Railway platformasida deploy qilingan:

### Backend API
- URL: https://tozahudud-production-00e5.up.railway.app
- Port: 3002
- Database: PostgreSQL (Railway)

### Frontend
- URL: https://frontend-production-5451.up.railway.app
- Nginx + React (Production build)

### Telegram Bot
- Alohida deploy qilinadi
- PostgreSQL bilan integratsiya

## 📦 Texnologiyalar

### Backend
- NestJS 11
- TypeORM
- PostgreSQL
- WebSockets (Socket.io)
- JWT Authentication
- Swagger API Documentation

### Frontend
- React 18
- Vite
- Leaflet (Maps)
- Chart.js
- Responsive Design

### Telegram Bot
- Python 3.11
- python-telegram-bot
- PostgreSQL
- Async/await

## 🛠️ Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 16
- Python 3.11+
- Docker & Docker Compose (optional)

### Environment Setup

1. Backend `.env`:
```env
NODE_ENV=development
PORT=3002

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=smart_trash_db

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
```

2. Telegram Bot `.env`:
```env
BOT_TOKEN=your_telegram_bot_token
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=smart_trash_db
```

### Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3002
- API Docs: http://localhost:3002/api/docs
- PostgreSQL: localhost:5432

### Manual Setup

#### Backend
```bash
cd backend
npm install
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Telegram Bot
```bash
cd TozaHudud_AI-bot
pip install -r requirements.txt
python bot.py
```

## 📚 API Documentation

Swagger UI: https://tozahudud-production-00e5.up.railway.app/api/docs

### Main Endpoints

#### Bins
- `GET /api/bins` - Barcha axlat qutilari
- `POST /api/bins` - Yangi quti qo'shish
- `PATCH /api/bins/:id` - Qutini yangilash
- `DELETE /api/bins/:id` - Qutini o'chirish
- `PATCH /api/bins/:id/clean` - Tozalangan deb belgilash

#### Vehicles
- `GET /api/vehicles` - Barcha transport vositalari
- `POST /api/vehicles` - Yangi transport qo'shish
- `PATCH /api/vehicles/:id` - Transport ma'lumotlarini yangilash

#### Alerts
- `GET /api/alerts` - Barcha ogohlantirishlar
- `PATCH /api/alerts/:id` - Ogohlantirishni yangilash

#### Telegram
- `GET /api/telegram/stats` - Bot statistikasi
- `GET /api/telegram/reports` - Fuqarolar murojaatlari
- `POST /api/telegram/broadcast` - Ommaviy xabar yuborish

## 🔐 Authentication

Admin Panel Login:
- Username: `admin`
- Password: istalgan parol (development)

Production uchun JWT authentication ishlatiladi.

## 📊 Database Schema

### Main Tables
- `bins` - Axlat qutilari
- `bin_history` - Quti tarixi
- `vehicles` - Transport vositalari
- `routes` - Marshrut
- `alerts` - Ogohlantirishlar
- `users` - Foydalanuvchilar
- `telegram_users` - Telegram bot foydalanuvchilari
- `telegram_reports` - Fuqarolar murojaatlari

## 🔧 Configuration

### Railway Environment Variables

Backend:
```
DB_HOST=<railway-postgres-host>
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<generated>
DB_NAME=railway
PORT=3002
JWT_SECRET=<generated>
```

Frontend:
```
BACKEND_URL=https://tozahudud-production-00e5.up.railway.app
PORT=80
```

## 📱 Telegram Bot Commands

- `/start` - Botni ishga tushirish
- `/report` - Murojaat yuborish
- `/feedback` - Fikr bildirish
- `/status` - Tizim holati
- `/help` - Yordam

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests
cd frontend
npm run test
```

## 📈 Monitoring

- Health Check: `/api/health`
- System Status: `/api/status`
- Metrics: Swagger UI

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit Pull Request

## 📝 License

MIT License - see LICENSE file

## 👥 Team

- Backend Developer: NestJS, PostgreSQL, TypeORM
- Frontend Developer: React, Vite, Leaflet
- Bot Developer: Python, Telegram Bot API
- DevOps: Railway, Docker, Nginx

## 📞 Support

Issues: GitHub Issues
Email: support@tozahudud.uz

---

Made with ❤️ for cleaner cities
