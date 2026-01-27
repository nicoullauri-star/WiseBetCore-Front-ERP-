<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# WiseBet Lab | Analytics Terminal V13 + Automation Engine

Terminal de analítica avanzada para el seguimiento de ROI y gestión de banca en apuestas deportivas. Esta versión incluye el **WiseBet Automation Engine**, un motor de scraping inteligente que mantiene tu historial actualizado automáticamente.

---

## 🚀 Motor de Automatización (New)

El sistema incluye ahora un bot avanzado (`scripts/scraper.cjs`) que sincroniza picks de Wintipster directamente a tu base de datos local.

### Características del Bot:
- **Lógica de Upsert**: No solo añade nuevos picks, sino que actualiza los resultados de aquellos marcados como `PENDING` automáticamente.
- **Evasión de Bloqueos**: Simula comportamiento humano con retardos aleatorios (jitter).
- **Consolidación de Datos**: Toda la información se centraliza en `database.json`, que actúa como la autoridad única del sistema.
- **Logs Profesionales**: Sistema de notificaciones detallado en el Hub de Automatización.

### Cómo Automatizar Diariamente:
Para que el sistema se actualice solo sin abrir el navegador:
1. Usa el archivo `wisebet_sync.bat` ubicado en la raíz.
2. Configura una "Tarea Programada" en Windows para que ejecute este `.bat` cada mañana (ej: 08:30 AM).
3. **Tip**: He configurado la tarea para que, si el PC está apagado a la hora programada, se ejecute inmediatamente al encender el equipo.

---

## 🛠️ Instalación y Uso Local

### Requisitos:
- Node.js (v18+)
- Chrome/Brave (para el motor de scraping)

### Pasos:
1. **Instalar dependencias**:
   ```bash
   npm install
   ```
2. **Ejecutar Dashboard**:
   ```bash
   npm run dev
   ```
3. **Acceso**: `http://localhost:3000` (Code: `admin123`)

---

## 📁 Estructura del Proyecto
- 📂 `scripts/`: Motores de scraping y utilidades de limpieza de DB.
- 📂 `docs/`: Documentación técnica y planes de desarrollo.
- 📄 `database.json`: Base de datos centralizada (Authority Source).
- 📄 `wisebet_sync.bat`: Disparador de automatización para Windows.

---

## Mantenimiento y QA
- Consulta [QA_CHECKLIST.md](./docs/QA_CHECKLIST.md) para ver la batería de pruebas.
- Consulta [CHANGELOG.md](./docs/CHANGELOG.md) para el historial de versiones.

---
**WiseBet Lab** - *Mastering the Edge.*
