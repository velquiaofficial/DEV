@echo off
cd /d "%~dp0"
echo Starting 299_FRUITDOCK on port 5399 ...
set PORT=5399
set VQ_OPEN=1
node server.js
pause
