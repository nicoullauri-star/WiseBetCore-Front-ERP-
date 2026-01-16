# Implementación del Servicio de Autenticación

## Resumen

Se ha creado un servicio centralizado de autenticación (`authService`) que gestiona los tokens JWT (access y refresh) y proporciona métodos para realizar llamadas API autenticadas con actualización automática de tokens.

## Archivos Creados

### 1. `/src/services/authService.ts` ⭐ (Principal)

**Funcionalidades:**
- ✅ Guardar tokens (access y refresh) en localStorage
- ✅ Guardar datos del usuario
- ✅ Obtener tokens y datos del usuario
- ✅ Actualizar el access token usando el refresh token
- ✅ Limpiar datos de autenticación (logout)
- ✅ Verificar si el usuario está autenticado
- ✅ Realizar llamadas API autenticadas con manejo automático de token expirado

**Métodos principales:**

```typescript
// Login y guardar tokens automáticamente
await authService.login(username, password);

// Verificar autenticación
authService.isAuthenticated();

// Obtener datos del usuario
authService.getUserData();

// Hacer llamadas API autenticadas (con refresh automático)
const response = await authService.authenticatedFetch(url, options);

// Refrescar token manualmente
await authService.refreshAccessToken();

// Logout
authService.logout();
```

### 2. `/src/hooks/useAuth.ts` (Hook de React)

Hook personalizado para usar en componentes React:

```typescript
const { user, isAuthenticated, login, logout } = useAuth();
```

### 3. `/src/services/apiService.example.ts` (Ejemplos)

Ejemplos de cómo crear servicios API que usan `authService.authenticatedFetch()`.

### 4. `/src/services/README.md` (Documentación)

Documentación completa con ejemplos de uso.

## Cambios en LoginPage.tsx

Se actualizó el componente para usar el servicio centralizado:

**Antes:**
```typescript
// Llamada directa a fetch
const response = await fetch(`${BASE_URL}/api/auth/login/`, {...});
const data = await response.json();
localStorage.setItem('access_token', data.access);
localStorage.setItem('refresh_token', data.refresh);
localStorage.setItem('user_data', JSON.stringify(data.user));
```

**Después:**
```typescript
// Uso del servicio centralizado
await authService.login(username, password);
// Los tokens se guardan automáticamente
```

## Flujo de Autenticación

### 1. Login
```
Usuario → LoginPage → authService.login()
                    ↓
              API /api/auth/login/
                    ↓
         Guardar tokens en localStorage
                    ↓
              Navegar a /dashboard
```

### 2. Llamadas API Autenticadas
```
Componente → authService.authenticatedFetch()
                    ↓
         Agregar header Authorization: Bearer {access_token}
                    ↓
              Hacer request a API
                    ↓
         ¿Respuesta 401 (token expirado)?
                    ↓
         SÍ → Llamar /api/auth/refresh/
            → Obtener nuevo access_token
            → Reintentar request original
                    ↓
              Retornar respuesta
```

### 3. Refresh Token
```
authService.refreshAccessToken()
         ↓
POST /api/auth/refresh/
Body: { "refresh": "xxx..." }
         ↓
Response: { "access": "yyy..." }
         ↓
Actualizar access_token en localStorage
```

## Ejemplo de Uso en Componentes

### Opción 1: Usar el servicio directamente
```typescript
import { authService } from '../services/authService';

// En una función async
const fetchData = async () => {
  const response = await authService.authenticatedFetch(
    'http://localhost:8000/api/data/'
  );
  const data = await response.json();
  return data;
};
```

### Opción 2: Usar el hook useAuth
```typescript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>No autenticado</div>;
  }
  
  return (
    <div>
      <p>Bienvenido {user?.username}</p>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
```

## Ventajas de esta Implementación

1. **Centralizado**: Todo el manejo de autenticación en un solo lugar
2. **Automático**: El refresh de tokens es transparente para el desarrollador
3. **Reutilizable**: Fácil de usar en cualquier componente o servicio
4. **Type-safe**: Completamente tipado con TypeScript
5. **Manejo de errores**: Gestión automática de errores de autenticación
6. **Limpio**: El código de los componentes queda más simple y legible

## Próximos Pasos Sugeridos

1. **Crear un ProtectedRoute component** para rutas que requieren autenticación
2. **Implementar interceptores globales** si usas axios en lugar de fetch
3. **Agregar manejo de expiración de refresh token** con redirección automática a login
4. **Considerar usar Context API** para compartir el estado de autenticación globalmente
5. **Implementar logout en el backend** para invalidar tokens

## Notas de Seguridad

- Los tokens se almacenan en `localStorage` (para producción, considerar httpOnly cookies)
- El servicio limpia automáticamente los tokens si el refresh falla
- Todas las peticiones autenticadas incluyen el header Authorization
- El refresh de tokens es automático y transparente

## Variables de Entorno

Asegúrate de tener configurada la variable de entorno:

```env
VITE_API_BASE_URL=http://localhost:8000
```
