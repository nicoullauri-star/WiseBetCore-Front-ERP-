# 📉 WiseBet ERP: Guía de Integración Backend - Terminal del Operador

Esta guía detalla la estructura de datos y los endpoints necesarios para conectar la **Terminal del Operador** con la base de datos y el backend.

---

## 1. Estructura de Datos de Señales (Picks)

El backend debe proveer un feed de apuestas disponibles. Cada objeto `Pick` debe incluir la cuota mínima calculada (Fair Odd + Margen).

### Modelo `Pick`
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | String | Identificador único de la señal. |
| `event` | String | Nombre del partido (e.g., "Lecce - Lazio"). |
| `league` | String | Liga y país. |
| `startTime` | DateTime | Fecha y hora del evento. |
| `market` | String | Descripción detallada del mercado. |
| `minOdd` | Float | **Crítico**: Cuota mínima aceptable para que tenga valor. |
| `targetStake` | Float | Cantidad total objetivo a apostar. |
| `placedStake` | Float | Cantidad ya apostada (inicialmente 0). |
| `status` | Enum | `NEW`, `PARTIAL`, `PLACED`, `HIDDEN`. |
| `bookieOdds` | JSON | Mapa de cuotas por casa: `{"WINAMAX": {"odd": 1.23, "liquidity": 100}, ...}`. |

---

## 2. Gestión de Perfiles (Accounts)

El operador necesita saber en qué cuenta está ejecutando la orden según la casa elegida.

### Modelo `Profile`
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | String | ID de la cuenta (e.g., "WIN-01"). |
| `bookie` | String | Casa de apuestas vinculada. |
| `balance` | Float | Saldo disponible actual. |
| `status` | String | `A` (Activo) o `B` (Descanso). |
| `owner` | String | Nombre del dueño de la cuenta. |

---

## 3. Registro de Ejecuciones (Bets)

Cada vez que el operador hace clic en "Registrar Operación", el backend debe realizar una transacción atómica.

### API Endpoint: `POST /api/executions`
**Body:**
```json
{
  "pickId": "S-101",
  "profileId": "WIN-01",
  "amount": 100.00,
  "odd": 1.23,
  "bookie": "WINAMAX"
}
```

**Lógica del Backend:**
1. Validar que el `profileId` tiene saldo suficiente.
2. Descontar `amount` del `balance` del perfil.
3. Actualizar el `placedStake` del Pick `S-101`.
4. Si `placedStake >= targetStake`, cambiar status a `PLACED`.
5. Si `placedStake < targetStake`, cambiar status a `PARTIAL`.
6. Insertar registro en la tabla `ExecutedBets`.

---

## 4. Auditoría y Resultados

Para la vista de "Resultados", se requiere un endpoint que devuelva el historial de ejecuciones con el cálculo de beneficio.

### Modelo `ExecutedBet`
- `profit`: `amount * (odd - 1)`
- `result`: `PENDING`, `WIN`, `LOSS`, `VOID` (Este estado vendrá de un scraper de resultados o actualización manual posterior).

---

## 5. Sugerencia de Mejoras para el Backend (Senior Dev insight)

- **WebSockets**: Se recomienda usar WebSockets para actualizar las cuotas en tiempo real en la terminal sin necesidad de refrescar.
- **Transaccionalidad**: Es vital usar transacciones SQL para evitar que el `placedStake` se desfase si dos operadores intentan ejecutar la misma señal simultáneamente.
