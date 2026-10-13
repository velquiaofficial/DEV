@echo off
cd /d "%~dp0"
echo Starting 134_HONEYHIVE on port 5234 ...
set PORT=5234
set VQ_OPEN=1
node server.js
pause
