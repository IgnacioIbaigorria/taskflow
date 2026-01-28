# TaskFlow Mobile

Aplicación móvil para TaskFlow - Gestión de tareas colaborativas.

## Tecnologías

- **React Native** con **Expo 50**
- **TypeScript**
- **React Navigation 6** - Navegación
- **React Native Paper** - UI Components (Material Design)
- **Axios** - HTTP Cliente
- **Socket.io** - WebSocket en tiempo real
- **AsyncStorage** - Almacenamiento local
- **Expo Local Authentication** - Autenticación biométrica
- **Jest** - Testing

## Características

✅ **Arquitectura MVVM** - Separación clara entre UI, lógica y datos  
✅ **Modo Oscuro** - Tema automático, claro y oscuro  
✅ **Modo Offline** - Funciona sin conexión, sincroniza al reconectar  
✅ **Autenticación Biométrica** - Face ID / Touch ID / Fingerprint  
✅ **Notificaciones en Tiempo Real** - Vía WebSocket  
✅ **Tests Unitarios** - Cobertura de servicios y lógica  

## Estructura del Proyecto

```
mobile/
├── src/
│   ├── models/              # Interfaces TypeScript
│   ├── services/            # Lógica de negocio y API
│   ├── contexts/            # React Context (State Management)
│   ├── screens/             # Pantallas de la app
│   ├── navigation/          # Configuración de navegación
│   └── theme/               # Colores y temas
├── __tests__/               # Tests unitarios
├── App.tsx                  # Punto de entrada
└── package.json
```

## Instalación y Ejecución

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Expo CLI: `npm install -g expo-cli`
- Para iOS: Xcode (solo macOS)
- Para Android: Android Studio

### Pasos

1. **Instalar dependencias:**

```bash
cd mobile
npm install
```

2. **Configurar la URL del backend:**

Editar `app.json` y actualizar `extra.apiUrl` y `extra.wsUrl` con la URL de tu backend:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://TU_IP:8080",
      "wsUrl": "ws://TU_IP:8080"
    }
  }
}
```

**Nota:** Para desarrollo en dispositivo físico, usa la IP de tu máquina, no `localhost`.

3. **Iniciar la aplicación:**

```bash
npm start
```

Luego:
- Presiona `i` para iOS Simulator (solo macOS)
- Presiona `a` para Android Emulator
- Escanea el QR con Expo Go en tu dispositivo físico

### Ejecutar en Dispositivos Específicos

```bash
# iOS
npm run ios

# Android
npm run android

# Web (preview)
npm run web
```

## Testing

```bash
# Ejecutar todos los tests
npm test

# Con coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Pantallas

### 1. Splash Screen
- Logo y verificación de sesión activa
- Redirección automática a Login o Home

### 2. Autenticación
- **Login:** Email y contraseña con validación
- **Register:** Nombre, email, contraseña con confirmación

### 3. Lista de Tareas (Home)
- Ver todas las tareas
- Filtrar por estado (Pending, In Progress, Completed)
- Indicadores visuales de prioridad
- Pull-to-refresh
- FAB para crear nueva tarea

### 4. Detalle de Tarea
- Información completa
- Editar título, descripción, prioridad
- Cambiar estado
- Eliminar tarea (con confirmación)

### 5. Crear Tarea
- Formulario con título, descripción y prioridad
- Validación de campos

### 6. Perfil
- Datos del usuario
- Estadísticas: total, completadas, pendientes, en progreso
- Toggle de modo oscuro
- Activar/desactivar autenticación biométrica
- Cerrar sesión

## Características Avanzadas

### Modo Offline

La app funciona completamente offline:

- Las tareas se almacenan en caché local
- Las acciones se guardan en una cola de sincronización
- Al reconectar, los cambios se sincronizan automáticamente
- Banner visual indica cuando estás offline

### Autenticación Biométrica

- Configuración en el perfil
- Usa Face ID, Touch ID o Fingerprint según el dispositivo
- Fallback a contraseña si no está disponible

### WebSocket en Tiempo Real

- Conexión automática al iniciar sesión
- Recibe actualizaciones de tareas en tiempo real
- Reconexión automática si se pierde la conexión
- Eventos: created, updated, deleted, assigned

### Modo Oscuro

- 3 opciones: Auto (sigue al sistema), Claro, Oscuro
- Persistencia de preferencia
- Transiciones suaves entre temas

## Construcción para Producción

### Android (APK)

```bash
expo build:android -t apk
```

### iOS (IPA - requiere cuenta Apple Developer)

```bash
expo build:ios
```

### Usando EAS Build (Recomendado)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Build Android
eas build --platform android

# Build iOS
eas build --platform ios
```

## Troubleshooting

### No se conecta al backend

- Verifica que el backend esté corriendo
- Si usas dispositivo físico, usa la IP de tu máquina, no `localhost`
- Verifica que no haya firewall bloqueando el puerto 8080

### WebSocket no funciona

- Asegúrate de que el backend soporte WebSocket
- Verifica la URL en `app.json` (debe ser `ws://` no `http://`)

### Autenticación biométrica no disponible

- Solo funciona en dispositivos físicos, no en simuladores/emuladores
- Verifica que el dispositivo tenga biometría configurada

## Licencia

MIT
