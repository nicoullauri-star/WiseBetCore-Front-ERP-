# Plan de Automatización: WiseBetLab Scraper Daily

Este documento detalla los pasos para automatizar la extracción de apuestas de Wintipster y su integración en el sistema WiseBetLab.

## 1. Arquitectura de la Solución
Crearemos un script de automatización que realice las siguientes tareas:
- **Scraping**: Acceder a las 3 URLs de archivos de Wintipster (Standard, Premium, Elite).
- **Extracción**: Identificar las apuestas del día actual.
- **Formateo**: Convertir los datos al formato de texto plano que el sistema ya reconoce.
- **Integración**: Insertar los nuevos datos en el archivo `database.json` local.
- **Programación**: Configurar una tarea programada en Windows para ejecutar esto diariamente a las 06:00 AM.

## 2. Herramientas a Utilizar
- **Node.js**: Por coherencia con el proyecto actual (Vite/React).
- **Puppeteer**: Para navegar la web y evadir protecciones básicas de bots.
- **FS (FileSystem)**: Para persistir los cambios en `database.json`.

## 3. Pasos de Implementación
### Paso 1: Creación del Script `scraper.js`
Desarrollaremos un script que use Puppeteer para abrir las URLs:
- `https://wintipster.com/standard-plan-archives/`
- `https://wintipster.com/premium-plan-archives/`
- `https://wintipster.com/elite-plan-archives/`

### Paso 2: Lógica de Identificación de Nuevos Picks
El script comparará los IDs de las apuestas extraídas con los ya existentes en `database.json` para evitar duplicados.

### Paso 3: Integración con el Formato de WiseBetLab
Utilizaremos la lógica de parseo existente en `index.tsx` pero en el script del servidor para que los datos entren directamente a la base de datos JSON.

### Paso 4: Automatización en Windows
Crearemos un archivo `.bat` sencillo que ejecute el script y lo programaremos en el "Programador de Tareas".

## 4. Próximo Paso
Comenzaremos creando el script `scraper.js` y probando la extracción en una de las URLs.
