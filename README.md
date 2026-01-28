# TaskFlow - Collaborative Task Management

![TaskFlow Banner](https://via.placeholder.com/1200x300/6200ee/ffffff?text=TaskFlow)

TaskFlow is a full-stack collaborative task management application built with Go + Gin backend and React Native + Expo mobile app.

## 🚀 Features

### Backend (Go + Gin)
- ✅ RESTful API with JWT authentication
- ✅ PostgreSQL database with GORM
- ✅ WebSocket for real-time notifications
- ✅ Swagger/OpenAPI documentation
- ✅ Unit tests with >80% coverage
- ✅ Docker & docker-compose ready

### Mobile App (React Native + Expo)
- ✅ MVVM architecture
- ✅ Dark mode support
- ✅ Offline mode with auto-sync
- ✅ Biometric authentication (Face ID / Touch ID / Fingerprint)
- ✅ Real-time updates via WebSocket
- ✅ Material Design with React Native Paper
- ✅ Unit tests

## 📋 Requirements

### Backend
- Go 1.21+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Mobile
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Mobile App    │◄───────►│   Backend API    │
│  (React Native) │  HTTP   │   (Go + Gin)     │
│                 │  + WS   │                  │
└─────────────────┘         └──────────────────┘
        │                            │
        │ AsyncStorage              │ GORM
        ▼                            ▼
┌─────────────────┐         ┌──────────────────┐
│  Local Cache    │         │   PostgreSQL     │
└─────────────────┘         └──────────────────┘
```

### Backend Architecture

```
backend/
├── cmd/server/          # Entry point
├── internal/
│   ├── config/         # Configuration
│   ├── database/       # DB connection & migrations
│   ├── models/         # Data models
│   ├── handlers/       # HTTP handlers (Controllers)
│   ├── services/       # Business logic
│   ├── repository/     # Data access layer
│   ├── middleware/     # Auth, CORS, etc.
│   └── websocket/      # WebSocket hub
└── tests/              # Unit tests
```

### Mobile Architecture (MVVM)

```
mobile/src/
├── models/             # Data models (TypeScript interfaces)
├── services/           # API, Storage, WebSocket (Data Layer)
├── contexts/           # State Management (ViewModel)
├── screens/            # UI Components (View)
├── navigation/         # Navigation setup
└── theme/              # Colors & styling
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd taskflow

# Start backend with Docker
docker-compose up --build

# Backend will be available at:
# API: http://localhost:8080
# Swagger: http://localhost:8080/swagger/index.html
```

### Option 2: Local Development

#### Backend

```bash
cd backend

# Install dependencies
go mod download

# Copy environment file
cp .env.example .env

# Edit .env with your PostgreSQL credentials

# Generate Swagger docs
swag init -g cmd/server/main.go -o docs

# Run
go run cmd/server/main.go
```

#### Mobile App

```bash
cd mobile

# Install dependencies
npm install

# Update backend URL in app.json
# Change "apiUrl" and "wsUrl" to your backend URL

# Start Expo
npm start

# Then press:
# - 'i' for iOS Simulator
# - 'a' for Android Emulator
# - Scan QR with Expo Go app on physical device
```

## 📱 Screenshots

| Login | Task List | Task Detail | Profile |
|-------|-----------|-------------|---------|
| ![Login](https://via.placeholder.com/200x400/6200ee/ffffff?text=Login) | ![Tasks](https://via.placeholder.com/200x400/6200ee/ffffff?text=Tasks) | ![Detail](https://via.placeholder.com/200x400/6200ee/ffffff?text=Detail) | ![Profile](https://via.placeholder.com/200x400/6200ee/ffffff?text=Profile) |

## 📖 API Documentation

Once the backend is running, access Swagger UI at:

```
http://localhost:8080/swagger/index.html
```

### Main Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/tasks` | List tasks (paginated) |
| POST | `/api/v1/tasks` | Create task |
| GET | `/api/v1/tasks/{id}` | Get task by ID |
| PUT | `/api/v1/tasks/{id}` | Update task |
| DELETE | `/api/v1/tasks/{id}` | Delete task |
| PATCH | `/api/v1/tasks/{id}/status` | Update task status |
| POST | `/api/v1/tasks/{id}/assign` | Assign task to user |
| GET | `/api/v1/ws` | WebSocket connection |

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
go test ./... -v

# With coverage
go test ./... -cover -coverprofile=coverage.out
go tool cover -html=coverage.out
```

### Mobile Tests

```bash
cd mobile

# Run tests
npm test

# With coverage
npm run test:coverage
```

## 🐳 Docker Deployment

The project includes a complete Docker setup:

```bash
# Build and start all services
docker-compose up --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres
```

Services:
- **Backend**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Swagger**: http://localhost:8080/swagger/index.html

## 🔑 Environment Variables

### Backend (.env)

```env
SERVER_PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=taskflow
DB_PASSWORD=taskflow123
DB_NAME=taskflow_db
JWT_SECRET=your-secret-key
JWT_EXPIRATION_HOURS=24
ALLOWED_ORIGINS=http://localhost:19006
```

### Mobile (app.json)

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_IP:8080",
      "wsUrl": "ws://YOUR_IP:8080"
    }
  }
}
```

## 📊 Database Schema

```sql
Users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── password (VARCHAR, HASHED)
├── name (VARCHAR)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

Tasks
├── id (UUID, PK)
├── title (VARCHAR)
├── description (TEXT)
├── status (ENUM: pending, in_progress, completed, cancelled)
├── priority (ENUM: low, medium, high, urgent)
├── due_date (TIMESTAMP, NULLABLE)
├── created_by (UUID, FK -> Users)
├── assigned_to (UUID, FK -> Users, NULLABLE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🎯 Technical Decisions

### Why Go + Gin?
- **Performance**: Gin is one of the fastest Go frameworks
- **Simplicity**: Clean, idiomatic code
- **Concurrency**: Built-in goroutines for WebSocket
- **Type Safety**: Static typing prevents runtime errors

### Why React Native + Expo?
- **Cross-platform**: Single codebase for iOS & Android
- **Fast Development**: Hot reload, OTA updates
- **Native Features**: Easy access to biometrics, storage
- **Expo Ecosystem**: Rich set of pre-built modules

### Why MVVM?
- **Testability**: Business logic separated from UI
- **Maintainability**: Clear separation of concerns
- **Scalability**: Easy to add new features
- **Team Collaboration**: Different developers can work on different layers

### Why PostgreSQL?
- **Reliability**: ACID compliance
- **Features**: JSON support, full-text search
- **Scalability**: Better than SQLite for production
- **Community**: Excellent documentation and support

## 🚀 Future Improvements

- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Task comments and attachments
- [ ] Team/workspace support
- [ ] Task categories and tags
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Task templates
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Kubernetes deployment

## 📝 License

MIT License - see LICENSE file for details

## 👤 Author

Developed as a technical assessment for Teamcore.

---

**Built with ❤️ using Go, React Native, and lots of coffee ☕**
