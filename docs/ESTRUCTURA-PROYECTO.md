# Estructura del Proyecto WiseBetCore Front-ERP

Este proyecto sigue las mejores prácticas de React con una estructura organizada y escalable.

## 📁 Estructura de Carpetas

```
/home/luis/WiseBetCore-Front-ERP-/
├── src/                        # Código fuente principal
│   ├── components/            # Componentes reutilizables
│   │   ├── Layout.tsx        # Layout principal con sidebar
│   │   ├── Sidebar.tsx       # Barra lateral de navegación
│   │   └── WiseBetLogo.tsx   # Logo de la aplicación
│   │
│   ├── pages/                # Vistas/páginas completas
│   │   ├── LoginPage.tsx     # Página de inicio de sesión
│   │   ├── GlobalDashboard.tsx    # Dashboard CEO
│   │   ├── OperationalCenter.tsx  # Centro Operativo
│   │   ├── OperationalNetwork.tsx # Red Operativa
│   │   ├── AuditPanel.tsx         # Panel de Auditoría
│   │   ├── FinanceModule.tsx      # Módulo de Finanzas
│   │   ├── ExecutionQuality.tsx   # Calidad de Ejecución
│   │   ├── GapAnalysis.tsx        # Análisis de Brechas
│   │   └── ValuebetsAnalysis.tsx  # Análisis de Valuebets
│   │
│   ├── services/             # Servicios API y lógica de negocio
│   │   ├── api.client.ts     # Cliente API principal
│   │   ├── token.manager.ts  # Gestión de tokens
│   │   └── ...
│   │
│   ├── hooks/                # Custom React Hooks
│   │   └── ...
│   │
│   ├── types/                # TypeScript types e interfaces
│   │   ├── navigation.types.ts
│   │   └── ...
│   │
│   ├── config/               # Configuraciones
│   │   ├── api.config.ts     # Configuración de API
│   │   └── ...
│   │
│   ├── App.tsx               # Componente principal de la aplicación
│   ├── index.tsx             # Punto de entrada de React
│   └── vite-env.d.ts         # Definiciones de tipos de Vite
│
├── docs/                     # Documentación del proyecto
├── logs/                     # Archivos de logs
├── dist/                     # Build de producción (generado)
├── node_modules/             # Dependencias (generado)
│
├── index.html                # HTML principal
├── vite.config.ts            # Configuración de Vite
├── tsconfig.json             # Configuración de TypeScript
├── package.json              # Dependencias y scripts
└── .env                      # Variables de entorno

```

## 🎯 Convenciones

### Componentes vs Páginas

- **`components/`**: Componentes reutilizables que pueden ser usados en múltiples páginas
  - Ejemplos: Layout, Sidebar, WiseBetLogo, Buttons, Cards, etc.
  
- **`pages/`**: Vistas completas que representan rutas específicas
  - Ejemplos: LoginPage, GlobalDashboard, OperationalCenter, etc.

### Importaciones

Todas las importaciones ahora usan rutas relativas desde `src/`:

```typescript
// En App.tsx
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';

// En páginas (pages/)
import { WiseBetLogo } from '../components/WiseBetLogo';
import { apiClient } from '../services/api.client';

// En componentes (components/)
import Sidebar from './Sidebar';
import { apiClient } from '../services/api.client';
```

### Alias de Importación

El proyecto está configurado con el alias `@` que apunta a `src/`:

```typescript
// Puedes usar (opcional):
import LoginPage from '@/pages/LoginPage';
import { apiClient } from '@/services/api.client';
```

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo en http://localhost:3000

# Producción
npm run build        # Genera el build de producción en dist/
npm run preview      # Previsualiza el build de producción
```

## 📝 Notas Importantes

1. **Todos los archivos de código fuente están en `src/`**: Esto mantiene el proyecto organizado y facilita la configuración de herramientas.

2. **Separación clara de responsabilidades**: 
   - Componentes reutilizables en `components/`
   - Vistas completas en `pages/`
   - Lógica de negocio en `services/`
   - Tipos compartidos en `types/`

3. **Configuración actualizada**: 
   - `vite.config.ts` apunta a `src/`
   - `tsconfig.json` tiene paths configurados correctamente
   - `index.html` carga `/src/index.tsx`

4. **Sin cambios en funcionalidad**: La reestructuración mantiene toda la funcionalidad existente intacta.

## 🔧 Mantenimiento

Al agregar nuevos archivos:
- Componentes reutilizables → `src/components/`
- Nuevas páginas/vistas → `src/pages/`
- Servicios API → `src/services/`
- Custom hooks → `src/hooks/`
- Tipos TypeScript → `src/types/`
- Configuraciones → `src/config/`
