@echo off
:: --- WiseBet Lab Automation Script ---
:: Navegar a la carpeta del proyecto
cd /d "c:\Users\nicou\Downloads\wisebetlab-tracker-roi"

:: Ejecutar la sincronización de todos los planes (Ayer y Hoy)
echo [WiseBet] Iniciando sincronización diaria... >> automation_logs.txt
node scripts/scraper.cjs --plan=ALL --duration=YESTERDAY

echo [WiseBet] Proceso de fondo completado: %date% %time% >> automation_logs.txt
exit
