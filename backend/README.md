# Smart Trash System - Backend API

Professional NestJS-based backend API for Smart Trash Management System with PostgreSQL database.

## Features

- ✅ **NestJS 11** - Progressive Node.js framework
- ✅ **PostgreSQL** - Robust relational database
- ✅ **TypeORM** - Advanced ORM with migrations
- ✅ **JWT Authentication** - Secure user authentication
- ✅ **Swagger Documentation** - Interactive API docs
- ✅ **Real-time WebSockets** - Live updates
- ✅ **Input Validation** - Class-validator with DTOs
- ✅ **Error Handling** - Global exception filters
- ✅ **Rate Limiting** - API throttling
- ✅ **Security** - Helmet, CORS, compression
- ✅ **Testing** - Jest unit and e2e tests
- ✅ **Code Quality** - ESLint + Prettier

## API Modules

### 🗑️ Bins Management
- CRUD operations for trash bins
- Real-time fill level monitoring
- Location tracking with GPS coordinates
- Sensor data integration
- History tracking
- Statistics and analytics

### 🚛 Vehicles Management
- Vehicle fleet tracking
- Real-time GPS location
- Driver management
- Fuel and maintenance tracking
- Route assignment
- Performance metrics

### 🗺️ Routes Optimization
- Intelligent route planning
- Real-time route tracking
- Progress monitoring
- Distance and time estimation
- Route optimization algorithms

### 🚨 Alerts System
- Real-time alert generation
- Multiple severity levels
- Alert acknowledgment
- Notification system
- Alert history

### 👥 User Management
- Role-based access control
- JWT authentication
- User profiles
- Activity logging

### 📊 Analytics & Reports
- Dashboard statistics
- Performance metrics
- Historical data analysis
- Export functionality

## Installation

```bash
# Clone repository
git clone <repository-url>
cd toza_hudud_ai_beckend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Setup PostgreSQL database
createdb smart_trash_db

# Run migrations (when available)
npm run migration:run

# Start development server
npm run start:dev
```

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=smart_trash_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Health & Status
```
GET  /api              # Health check
GET  /api/status       # System status
```

### Bins Management
```
GET    /api/bins              # Get all bins (with filtering)
POST   /api/bins              # Create new bin
GET    /api/bins/statistics   # Get bins statistics
GET    /api/bins/:id          # Get bin by ID
PATCH  /api/bins/:id          # Update bin
DELETE /api/bins/:id          # Delete bin
PATCH  /api/bins/:id/clean    # Mark bin as cleaned
```

### Query Parameters for Bins
```
?page=1&limit=10              # Pagination
?type=general|plastic|organic # Filter by type
?status=active|inactive       # Filter by status
?district=yakkasaroy         # Filter by district
?minFillLevel=0&maxFillLevel=100  # Fill level range
?isOnline=true|false         # Online status
?search=BIN-001              # Search in code/address
?sortBy=fillLevel&sortOrder=DESC  # Sorting
```

## Database Schema

### Bins Table
- `id` (UUID, Primary Key)
- `code` (String, Unique) - Bin identifier
- `address` (String) - Physical address
- `district` (String) - District name
- `latitude/longitude` (Decimal) - GPS coordinates
- `capacity` (Integer) - Capacity in liters
- `fillLevel` (Decimal) - Current fill percentage
- `type` (Enum) - Waste type
- `status` (Enum) - Bin status
- `sensorId` (String) - Sensor identifier
- `isOnline` (Boolean) - Sensor connectivity
- `batteryLevel` (Integer) - Sensor battery
- `temperature/humidity` (Decimal) - Environmental data
- `lastUpdate/lastCleaned` (Timestamp)

### Bin History Table
- Tracks all bin activities
- Fill level changes
- Status changes
- Cleaning events
- Maintenance records

## Development

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod

# Testing
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:cov       # Coverage

# Code quality
npm run lint           # ESLint
npm run format         # Prettier
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api
- **System Status**: http://localhost:3001/api/status

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/bins",
  "method": "POST"
}
```

## Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API throttling (100 req/min)
- **Input Validation** - DTO validation with class-validator
- **SQL Injection Protection** - TypeORM query builder
- **XSS Protection** - Input sanitization

## Performance Features

- **Compression** - Response compression
- **Database Indexing** - Optimized queries
- **Pagination** - Efficient data loading
- **Caching** - Redis integration ready
- **Connection Pooling** - Database optimization

## Monitoring & Logging

- **Health Checks** - System status monitoring
- **Error Tracking** - Global exception handling
- **Request Logging** - HTTP request logs
- **Performance Metrics** - Response time tracking

## Deployment

```bash
# Production build
npm run build

# Start production server
npm run start:prod

# Using PM2
pm2 start dist/main.js --name smart-trash-api

# Docker deployment
docker build -t smart-trash-api .
docker run -p 3001:3001 smart-trash-api
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.
