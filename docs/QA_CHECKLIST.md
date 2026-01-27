# QA Checklist - WiseBet Lab Tracker ROI

Este documento detalla las pruebas realizadas para asegurar la estabilidad y robustez del terminal.

## 1. Casos de Importación (Parsing)
- [x] **Texto Estándar**: Verificados bloques con Fecha, Evento, Bet, Odds y FT.
- [x] **Múltiples Partidos**: Soporte para formatos "Double" con varios eventos por pick.
- [x] **Espacios y Líneas Blancas**: El parser ignora líneas vacías y espacios extra al principio/final.
- [x] **Case Sensitivity**: Soporte para etiquetas en mayúsculas/minúsculas (BET:, bet:).
- [x] **Tipos de Resultado**: WIN, LOSS, VOID, HALF WIN, HALF LOSS verificados.

## 2. Gestión de Datos (Persistence & Logic)
- [x] **LocalStorage Robusto**: Implementado `try-catch` para evitar crashes por JSON malformado.
- [x] **Eliminación de Duplicados**: Herramienta probada; detecta picks idénticos por fecha/evento/cuota/plan.
- [x] **Recálculo de Banca**: Las métricas (ROI, Yield, Drawdown) se actualizan instantáneamente al cambiar la banca inicial.
- [x] **Migración de Datos**: Los picks antiguos se adaptan automáticamente a la nueva estructura de `matches`.

## 3. Interfáz y Visualización (UI/UX)
- [x] **Responsive Design**: Verificado en Desktop (Ultra-wide) y Mobile (Vite Dev Server).
- [x] **Charts Integration**: Chart.js no genera leaks; las instancias se destruyen antes de recrearse.
- [x] **Sticky Headers**: Cabecera de tabla fija en el historial para navegación rápida.
- [x] **Filtros Real-Time**: Filtrado por fecha, plan, mercado y texto verificado.

## 4. Seguridad y Hardening
- [x] **Filtro de Secretos**: Eliminados imports y dependencias de IA no utilizadas.
- [x] **Autenticación**: Acceso protegido por código `admin123` (Configurable en `index.tsx`).

## Notas de Auditoría
- **Estado Inicial**: Si la base de datos está vacía, el dashboard muestra un mensaje de guía en lugar de una pantalla en blanco.
- **Rendimiento**: Carga fluida de +1000 picks en el navegador.
