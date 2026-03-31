@echo off
echo ========================================
echo Raizes Educacional - Desenvolvimento Paralelo
echo ========================================
echo.
echo LEGADO (Vanilla JS):  http://localhost:8080
echo NEXT.JS 15:           http://localhost:3000
echo.
echo Pressione Ctrl+C para encerrar ambos servidores
echo ========================================
echo.

start "Raizes Legacy" cmd /k "cd /d legacy && npm run dev"
timeout /t 2 /nobreak >nul
start "Raizes Next.js" cmd /k "cd /d apps\web && npm run dev"

echo.
echo Servidores iniciados!
echo Feche as janelas para encerrar.
pause
