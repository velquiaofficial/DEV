@echo off
cd /d "%~dp0"
echo Starting 151_INKKEEP on port 5251 ...
set PORT=5251
set VQ_OPEN=1
node server.js
pause
