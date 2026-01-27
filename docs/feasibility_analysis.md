# Análisis de Viabilidad de Integración: WiseBet Lab

## Escenarios de Integración

### 1. API ↔ API (Enfoque Recomendado)
Integración mediante el consumo cruzado de endpoints REST.
- **Ventajas**: Desacoplamiento total, escalabilidad independiente, seguridad perimetral clara (JWT).
- **Esfuerzo**: Bajo-Medio. Requiere definir contratos OpenAPI.

### 2. Compartir Base de Datos (NO Recomendado)
Acceso directo de otro sistema a la base de datos PostgreSQL de WiseBet.
- **Riesgos**: Colisión de esquemas, problemas de concurrencia, degradación de performance, vulnerabilidad de seguridad.
- **Esfuerzo**: Innecesario dado el stack actual.

---

## Compatibilidad Técnica y Riesgos

| Factor | Estado | Riesgo / Mitigación |
| :--- | :--- | :--- |
| **Auth** | JWT | **Bajo**. Estándar de la industria. Fácil de integrar con SSO. |
| **Schema** | Postgres | **Medio**. Riesgo de duplicidad si el otro sistema maneja entidades de apuestas similares. |
| **Frontend** | React 19 | **Punto de cuidado**. React 19 es muy reciente. Podría haber conflictos con librerías externas legacy. |
| **CORS** | Configurado | Configurar `DJANGO_CORS_ALLOWED_ORIGINS` para permitir el nuevo dominio. |

---

## Contrato de Integración Sugerido

Para integrar con un sistema externo (ej: un Proveedor de Picks Directo):
1.  **Ingesta**: El sistema externo debe enviar POST a `/api/picks/` con el esquema JSON definido.
2.  **Sincronización**: Estrategia de **Tiempo Real** mediante Webhooks o polling de corta duración.
3.  **Mapeo**:
    - `ExternalID` ↔ `Pick.external_id` (añadir este campo al modelo).
    - `Profit` ↔ `Pick.profit` (calculado por el emisor o el receptor).

---

## Matriz de Riesgos

| Riesgo | Impacto | Probabilidad | Mitigación |
| :--- | :--- | :--- | :--- |
| Inconsistencia de Datos | Alto | Media | Validaciones estrictas en Serializers de DRF. |
| Desbordamiento de Carga | Medio | Baja | Implementar Rate Limiting y Redis caching. |
| Breaking Changes en API | Alto | Media | Versionado de API (`/api/v1/...`). |

---

## Plan de Implementación Propuesto

- **Fase 0 (Auditoría - 1 semana)**: Revisar Swagger completo y documentar casos de borde.
- **Fase 1 (Auth Unificada - 1 semana)**: Configurar el sistema externo como "authorized client".
- **Fase 2 (Endpoints de Sync - 2 semanas)**: Desarrollar endpoints de batch import/export.
- **Fase 3 (UAT - 1 semana)**: Pruebas de integración en ambiente sandbox.

**Estimación de esfuerzo total**: **Media** (4-6 semanas para una integración robusta).

---

## Recomendación Final
**Viabilidad**: **ALTA (SÍ)**.
El sistema actual es altamente integrable gracias a su arquitectura RESTful y el uso de estándares (JWT, Postgres, React/TS).

**Enfoque Sugerido**: Integración vía API REST con **Webhooks** para actualizaciones de resultados en tiempo real. Este enfoque minimiza el acoplamiento y maximiza la confiabilidad del sistema.
