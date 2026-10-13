@echo off
cd /d "%~dp0"
echo Starting 211_INKSOIL on port 5311 ...
set PORT=5311
set VQ_OPEN=1
node server.js
pause
