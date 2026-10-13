@echo off
cd /d "%~dp0"
echo Starting 77_RENTAL_LEDGER on port 5677 ...
set PORT=5677
set VQ_OPEN=1
node server.js
pause
