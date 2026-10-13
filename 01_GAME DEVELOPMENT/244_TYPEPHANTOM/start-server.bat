@echo off
cd /d "%~dp0"
echo Starting 244_TYPEVEIL on port 5344 ...
set PORT=5344
set VQ_OPEN=1
node server.js
pause
