# Guía de Despliegue y Ejecución "En Cualquier Lugar"

Esta guía te explicará paso a paso cómo levantar tu base de datos y backend usando Docker, y cómo configurar tu aplicación móvil para que funcione tanto en tu PC local como desde cualquier dispositivo en tu red (o internet).

## 1. Requisitos Previos

*   **Docker Desktop** instalado y ejecutándose en tu PC.
*   **Node.js** y **NPM** instalados.
*   Tu PC y tu dispositivo móvil deben estar conectados a la **misma red Wi-Fi** (para acceso local).

---

## 2. Levantar la Base de Datos y Backend (Docker)

El proyecto ya incluye un archivo `docker-compose.yml` configurado para levantar PostgreSQL y el Backend automáticamente.

1.  Abre una terminal en la carpeta raíz del proyecto (`c:\Proyectos\taskflow`).
2.  Ejecuta el siguiente comando:

    ```bash
    docker-compose up -d --build
    ```

    *   `up`: Levanta los servicios.
    *   `-d`: Detached mode (corre en segundo plano).
    *   `--build`: Fuerza la reconstrucción del contenedor del backend (útil si hiciste cambios en el código Go).

3.  Verifica que estén corriendo:

    ```bash
    docker-compose ps
    ```

    Deberías ver `taskflow-postgres` (puerto 5432) y `taskflow-backend` (puerto 8080) en estado `Up`.

---

## 3. Conectarse a la Base de Datos desde Cualquier PC

Una vez que el contenedor de Docker está corriendo, la base de datos está expuesta en el puerto `5432` de tu PC anfitriona.

### Datos de Conexión
*   **Host**: La dirección IP de tu PC (ver sección "Cómo saber tu IP").
*   **Puerto**: `5432`
*   **Usuario**: `taskflow`
*   **Contraseña**: `taskflow123`
*   **Base de Datos**: `taskflow_db`

### Pasos para conectar otra PC:
1.  Asegúrate de que el **Firewall de Windows** de tu PC principal permita conexiones entrantes en el puerto `5432`.
2.  Desde la otra PC, usa un cliente como **DBeaver**, **PgAdmin** o **HeidiSQL**.
3.  Crea una nueva conexión PostgreSQL usando la **IP de tu PC principal** como Host.

---

## 4. Configurar la App Móvil

Para que tu celular (o el emulador) se conecte al backend, necesita conocer la dirección IP de tu PC, ya que `localhost` dentro del celular se refiere al propio celular.

### Paso 1: Obtener tu IP Local
1.  Abre una terminal (PowerShell o CMD).
2.  Escribe `ipconfig`.
3.  Busca la línea **"Dirección IPv4"** de tu adaptador Wi-Fi o Ethernet (ejemplo: `192.168.1.15`).

### Paso 2: Actualizar `app.json`
1.  Abre el archivo `mobile/app.json`.
2.  Busca la sección `extra`.
3.  Actualiza `apiUrl` y `wsUrl` con tu IP:

    ```json
    "extra": {
      "apiUrl": "http://192.168.1.15:8080",
      "wsUrl": "ws://192.168.1.15:8080"
    }
    ```
    *(Reemplaza `192.168.1.15` por tu IP real).*

### Paso 3: Ejecutar la App Móvil
1.  Navega a la carpeta mobile: `cd mobile`.
2.  Instala dependencias (si no lo has hecho): `npm install`.
3.  Inicia Expo:

    ```bash
    npx expo start --clear
    ```

4.  Escanea el código QR con tu celular (usando la app **Expo Go**) o presiona `a` para abrir en Emulador Android.

---

## 5. Solución de Problemas Comunes

### No puedo conectar a la Base de Datos desde otra PC
*   **Firewall**: Abre "Windows Defender Firewall con seguridad avanzada". Crea una "Regla de Entrada" para el puerto TCP `5432`.
*   **Ping**: Intenta hacer `ping <TU_IP>` desde la otra PC para verificar que se ven en la red.

### La App Móvil da "Network Error"
*   Verifica que tu celular y PC estén en la **misma red Wi-Fi**.
*   Asegúrate de haber puesto la IP correcta en `app.json`. NO uses `localhost` ni `127.0.0.1`.
*   Asegúrate de que el backend esté corriendo (`docker-compose ps`).

### Quiero acceder desde Internet (fuera de casa)
Para esto necesitas exponer tu PC a internet, lo cual tiene riesgos de seguridad. Las opciones seguras son:
1.  **Ngrok**: Herramienta gratuita para crear túneles seguros.
    *   Instala ngrok y corre: `ngrok http 8080`.
    *   Usa la URL que te da ngrok (ej: `https://abcd-123.ngrok.io`) en tu `app.json`.
2.  **VPS / Cloud**: Desplegar tu Docker en un servidor real (AWS, DigitalOcean, Render).

---

## Comandos Importantes

*   **Detener todo**: `docker-compose down`
*   **Ver logs**: `docker-compose logs -f`
*   **Reiniciar backend**: `docker-compose restart backend`
