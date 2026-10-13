@echo off
cd /d "%~dp0"
echo Starting 172_NEONQ on port 5272 ...
set PORT=5272
set VQ_OPEN=1
node server.js
pause
