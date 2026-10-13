@echo off
cd /d "%~dp0"
echo Starting 65_PRICE_MATRIX on port 5665 ...
set PORT=5665
set VQ_OPEN=1
node server.js
pause
