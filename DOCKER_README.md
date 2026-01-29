# 🐳 Configuración de Docker para WiseBet Frontend

Esta guía explica cómo usar la configuración de Docker para el proyecto Angular/React.

## 📁 Archivos de Configuración

- **Dockerfile**: Build multi-etapa (Node.js + Nginx)
- **nginx.conf**: Configuración de Nginx para el contenedor frontend
- **nginx.main.conf**: Configuración del Nginx principal (reverse proxy)
- **docker-compose.prod.yml**: Orquestación de servicios para producción
- **.dockerignore**: Optimización del contexto de build

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Internet (Puerto 80/443)              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Nginx Principal (Reverse Proxy)             │
│                  - SSL/TLS Termination                   │
│                  - Load Balancing                        │
└────────────┬────────────────────────────┬────────────────┘
             │                            │
             ▼                            ▼
┌────────────────────────┐   ┌───────────────────────────┐
│  Frontend Container    │   │   Backend Container       │
│  - Nginx               │   │   - Django + Gunicorn     │
│  - Angular/React SPA   │   │   - Puerto 8000           │
│  - Puerto 80           │   │                           │
│  - Proxy /api/ → Backend│  │                           │
└────────────────────────┘   └───────────────────────────┘
```

## 🚀 Uso Rápido

### 1. Build de la imagen

```bash
# Desde el directorio del frontend
docker build -t wisebet-frontend:latest .
```

### 2. Ejecutar solo el frontend (desarrollo)

```bash
docker run -d \
  --name wisebet-frontend \
  -p 8080:80 \
  wisebet-frontend:latest
```

Accede en: http://localhost:8080

### 3. Ejecutar con Docker Compose (producción completa)

```bash
# Asegúrate de ajustar las rutas en docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en el directorio del frontend si necesitas variables de entorno en tiempo de build:

```env
VITE_API_URL=https://api.tudominio.com
VITE_APP_NAME=WiseBet
```

**Nota**: Para usar variables de entorno en Vite, deben tener el prefijo `VITE_`.

### Personalizar Nginx

#### nginx.conf (Frontend Container)
- **Proxy /api/**: Redirige peticiones al backend Django
- **Fallback SPA**: Maneja rutas de Angular/React
- **Caché**: Configuración optimizada para assets estáticos
- **Compresión**: Gzip habilitado

#### nginx.main.conf (Main Reverse Proxy)
- **SSL/TLS**: Configuración comentada, descomenta cuando tengas certificados
- **Upstreams**: Balanceo de carga entre contenedores
- **Health Checks**: Endpoint `/health` para monitoreo

## 🔒 SSL/HTTPS (Producción)

### Opción 1: Certbot (Let's Encrypt)

1. Asegúrate de que tu dominio apunte al servidor
2. El servicio `certbot` en docker-compose se encargará de renovar certificados

```bash
# Primera vez: obtener certificados
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d tudominio.com \
  -d www.tudominio.com
```

3. Descomenta la sección HTTPS en `nginx.main.conf`
4. Reemplaza `tu-dominio.com` con tu dominio real
5. Reinicia Nginx:

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

### Opción 2: Certificados propios

Coloca tus certificados en `./ssl/` y actualiza las rutas en `nginx.main.conf`.

## 🔧 Troubleshooting

### El frontend no se conecta al backend

1. Verifica que ambos contenedores estén en la misma red:
   ```bash
   docker network inspect wisebet_network
   ```

2. Verifica que el backend esté escuchando en el puerto 8000:
   ```bash
   docker logs wisebet_backend_prod
   ```

3. Prueba la conectividad desde el contenedor frontend:
   ```bash
   docker exec -it wisebet_frontend_prod wget -O- http://backend:8000/api/
   ```

### Error 502 Bad Gateway

- El backend no está respondiendo
- Verifica health checks:
  ```bash
  docker compose -f docker-compose.prod.yml ps
  ```

### Rutas de Angular no funcionan (404)

- Verifica que `try_files $uri $uri/ /index.html;` esté en `nginx.conf`
- Revisa los logs de Nginx:
  ```bash
  docker logs wisebet_frontend_prod
  ```

## 📊 Monitoreo

### Ver logs en tiempo real

```bash
# Todos los servicios
docker compose -f docker-compose.prod.yml logs -f

# Solo frontend
docker compose -f docker-compose.prod.yml logs -f frontend

# Solo nginx principal
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Health checks

```bash
# Frontend
curl http://localhost/health

# Backend (a través del proxy)
curl http://localhost/api/schema/
```

## 🛠️ Comandos Útiles

```bash
# Detener todos los servicios
docker compose -f docker-compose.prod.yml down

# Detener y eliminar volúmenes
docker compose -f docker-compose.prod.yml down -v

# Rebuild sin caché
docker compose -f docker-compose.prod.yml build --no-cache

# Ver uso de recursos
docker stats

# Ejecutar comando en contenedor
docker exec -it wisebet_frontend_prod sh
```

## 📝 Notas Importantes

1. **Rutas en docker-compose.prod.yml**: Ajusta las rutas relativas del backend según tu estructura de carpetas
2. **CORS**: Asegúrate de que Django tenga configurado CORS para aceptar peticiones del frontend
3. **Volúmenes compartidos**: `static_volume` y `media_volume` permiten que Nginx sirva archivos estáticos de Django
4. **Seguridad**: En producción, cambia `server_name _` por tu dominio real

## 🔄 Actualización en Producción

```bash
# 1. Pull últimos cambios
git pull origin main

# 2. Rebuild y restart
docker compose -f docker-compose.prod.yml up -d --build

# 3. Verificar
docker compose -f docker-compose.prod.yml ps
```

## 📚 Referencias

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
