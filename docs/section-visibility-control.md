# Control de Visibilidad de Secciones por API

## Overview
El componente `OperationalCenter.tsx` ahora carga dinámicamente la visibilidad de sus secciones desde la API de navegación, permitiendo que el backend controle qué secciones puede ver cada usuario según sus permisos.

## Implementación

### Secciones Controladas
El Centro Operativo tiene 3 secciones principales que ahora se controlan dinámicamente:

1. **Centro de Alertas de Flota** (`co-alertas`)
   - Muestra alertas operativas críticas
   - Estado: `showAlerts`

2. **Explorador de Flota** (`co-explorer`)
   - Navegador de ecosistemas y perfiles
   - Estado: `showExplorer`

3. **Planificador Táctico de Rotación** (`co-planner`)
   - Calendario de rotación A/B
   - Estado: `showPlanner`

### Flujo de Carga

```typescript
useEffect(() => {
  const loadSectionVisibility = async () => {
    try {
      // 1. Obtener navegación del usuario desde la API
      const data = await apiClient.getNavigation();
      
      // 2. Buscar el menú "Centro Operativo" (code: 'ops_center')
      const operationalCenterMenu = data.navigation.find(
        item => item.code === 'ops_center'
      );

      // 3. Verificar qué secciones están disponibles
      if (operationalCenterMenu?.sections) {
        setShowAlerts(sections.some(s => s.code === 'co-alertas'));
        setShowExplorer(sections.some(s => s.code === 'co-explorer'));
        setShowPlanner(sections.some(s => s.code === 'co-planner'));
      }
    } catch (error) {
      // En caso de error, mostrar todas las secciones
      console.error('Error loading section visibility:', error);
    }
  };

  loadSectionVisibility();
}, []);
```

### Respuesta de la API

La API devuelve la estructura de navegación con las secciones permitidas:

```json
{
  "user": { ... },
  "navigation": [
    {
      "id": 13,
      "name": "Centro Operativo",
      "code": "ops_center",
      "icon": "psychology",
      "route": "/centro-operativo",
      "order": 40,
      "children": [],
      "sections": [
        {
          "id": 3,
          "name": "Centro de Alertas de Flota",
          "code": "co-alertas",
          "icon": null,
          "route": "/",
          "order": 10
        },
        {
          "id": 5,
          "name": "Explorador de Flota",
          "code": "co-explorer",
          "icon": null,
          "route": "/",
          "order": 20
        },
        {
          "id": 4,
          "name": "Planificador Táctico de Rotación",
          "code": "co-planner",
          "icon": null,
          "route": "/",
          "order": 30
        }
      ]
    }
  ]
}
```

### Comportamiento

#### Estados Iniciales
- Por defecto, todas las secciones están **ocultas** (`false`)
- Esto previene que se muestren secciones antes de verificar permisos

#### Después de Cargar la API
- **Si la sección existe en la respuesta**: Se muestra (`true`)
- **Si la sección NO existe**: Permanece oculta (`false`)
- **Si hay error en la API**: Se muestran todas como fallback (`true`)

#### Renderizado Condicional
```tsx
{showAlerts && (
  <section id="co-alertas">
    {/* Centro de Alertas de Flota */}
  </section>
)}

{showExplorer && (
  <section id="co-explorer">
    {/* Explorador de Flota */}
  </section>
)}

{showPlanner && (
  <section id="co-planner">
    {/* Planificador Táctico de Rotación */}
  </section>
)}
```

## Ventajas

✅ **Control Centralizado**: Los permisos se gestionan desde el backend  
✅ **Seguridad**: El usuario solo ve lo que tiene permitido  
✅ **Flexibilidad**: Fácil agregar/quitar secciones sin cambiar código frontend  
✅ **Escalable**: Mismo patrón aplicable a otros componentes  
✅ **Fallback Seguro**: En caso de error, muestra todas las secciones  

## Ejemplo de Uso

### Usuario con Permisos Completos
Si el backend devuelve las 3 secciones → Se muestran las 3 secciones

### Usuario con Permisos Limitados
Si el backend solo devuelve `co-alertas` y `co-explorer` → Solo se muestran esas 2 secciones, el Planificador queda oculto

### Usuario sin Permisos
Si el backend no devuelve ninguna sección → No se muestra ninguna sección (página vacía)

## Códigos de Sección

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `co-alertas` | Centro de Alertas de Flota | Alertas operativas y críticas |
| `co-explorer` | Explorador de Flota | Navegador de ecosistemas y perfiles |
| `co-planner` | Planificador Táctico de Rotación | Calendario de rotación A/B |

## Aplicación a Otros Componentes

Este mismo patrón puede aplicarse a cualquier componente que necesite control de visibilidad basado en permisos:

1. Identificar el `code` del menú padre en la API
2. Definir códigos únicos para cada sección
3. Crear estados de visibilidad
4. Cargar desde la API en `useEffect`
5. Renderizar condicionalmente con `&&`
