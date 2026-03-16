@echo off
title Metropoly Server + ngrok

rem Change to this script's directory (your project root)
cd /d "%~dp0"

echo Starting Metropoly server on port 8000...
start "Metropoly Server" cmd /k "node server.js"

rem Small delay to let Node start up
timeout /t 3 /nobreak >nul

echo Starting ngrok tunnel on port 8000...
start "ngrok Tunnel" cmd /k "ngrok http 8000"

echo.
echo Both windows should stay open while you play.
echo Share the https://... URL shown in the ngrok window.
pause

