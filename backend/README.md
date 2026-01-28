# TaskFlow Backend

Backend API para TaskFlow - Aplicación de gestión de tareas colaborativas.

## Tecnologías

- **Go 1.21+**
- **Gin** - Framework web
- **PostgreSQL** - Base de datos
- **GORM** - ORM
- **JWT** - Autenticación
- **WebSocket** - Notificaciones en tiempo real
- **Swagger** - Documentación de API
- **Docker** - Containerización

## Estructura del Proyecto

```
backend/
├── cmd/server/          # Punto de entrada de la aplicación
├── internal/
│   ├── config/         # Configuración
│   ├── database/       # Conexión a la base de datos
│   ├── models/         # Modelos de datos
│   ├── handlers/       # Controladores HTTP
│   ├── middleware/     # Middleware (Auth, CORS)
│   ├── repository/     # Capa de acceso a datos
│   ├── services/       # Lógica de negocio
│   └── websocket/      # WebSocket hub
├── tests/              # Tests unitarios
├── docs/               # Documentación Swagger
└── Dockerfile
```

## Endpoints

### Autenticación
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

### Tareas (requiere autenticación)
- `GET /api/v1/tasks` - Listar tareas (paginado)
- `POST /api/v1/tasks` - Crear tarea
- `GET /api/v1/tasks/{id}` - Obtener tarea
- `PUT /api/v1/tasks/{id}` - Actualizar tarea
- `DELETE /api/v1/tasks/{id}` - Eliminar tarea
- `PATCH /api/v1/tasks/{id}/status` - Cambiar estado
- `POST /api/v1/tasks/{id}/assign` - Asignar a usuario

### WebSocket
- `GET /api/v1/ws` - Conexión WebSocket para notificaciones en tiempo real

## Instalación y Ejecución

### Opción 1: Con Docker (Recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up --build

# La API estará disponible en http://localhost:8080
# Swagger en http://localhost:8080/swagger/index.html
```

### Opción 2: Local

#### Prerrequisitos
- Go 1.21 o superior
- PostgreSQL 15

#### Pasos

1. Clonar el repositorio y entrar al directorio backend:
```bash
cd backend
```

2. Instalar dependencias:
```bash
go mod download
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

4. Generar documentación Swagger:
```bash
# Instalar swag si no lo tienes
go install github.com/swaggo/swag/cmd/swag@latest

# Generar docs
swag init -g cmd/server/main.go -o docs
```

5. Ejecutar la aplicación:
```bash
go run cmd/server/main.go
```

La API estará disponible en `http://localhost:8080`

## Testing

Ejecutar todos los tests:
```bash
go test ./... -v
```

Con coverage:
```bash
go test ./... -cover -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

## Documentación de la API

Una vez que el servidor esté corriendo, acceder a:
- Swagger UI: `http://localhost:8080/swagger/index.html`

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| SERVER_PORT | Puerto del servidor | 8080 |
| GIN_MODE | Modo de Gin (debug/release) | debug |
| DB_HOST | Host de PostgreSQL | localhost |
| DB_PORT | Puerto de PostgreSQL | 5432 |
| DB_USER | Usuario de la BD | taskflow |
| DB_PASSWORD | Contraseña de la BD | taskflow123 |
| DB_NAME | Nombre de la BD | taskflow_db |
| JWT_SECRET | Secret para JWT | change-me |
| JWT_EXPIRATION_HOURS | Horas de expiración del token | 24 |
| ALLOWED_ORIGINS | Orígenes permitidos CORS | - |

## WebSocket

Para conectarse al WebSocket, primero autenticar y luego:

```javascript
const token = "your-jwt-token";
const ws = new WebSocket(`ws://localhost:8080/api/v1/ws?token=${token}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Task event:', data);
};
```

Eventos disponibles:
- `created` - Tarea creada
- `updated` - Tarea actualizada
- `deleted` - Tarea eliminada
- `assigned` - Tarea asignada

## Licencia

MIT
