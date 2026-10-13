@echo off
cd /d "%~dp0"
echo Starting 02_PRISM_SHIFT on port 6244 ...
set PORT=6244
set VQ_OPEN=1
node server.js
pause
