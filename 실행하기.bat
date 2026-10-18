@echo off
cd /d "%~dp0"
echo Starting golf handbook server...
start "golf handbook server - close this window to stop" py server.py 8630
timeout /t 2 /nobreak >nul
start "" http://localhost:8630
