@echo off
cd /d "%~dp0"
echo Starting 247_CARDVAULT on port 5347 ...
set PORT=5347
set VQ_OPEN=1
node server.js
pause
