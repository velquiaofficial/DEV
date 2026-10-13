@echo off
cd /d "%~dp0"
echo Starting 163_INKRIDDLE on port 5263 ...
set PORT=5263
set VQ_OPEN=1
node server.js
pause
