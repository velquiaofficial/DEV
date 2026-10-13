@echo off
cd /d "%~dp0"
echo Starting 182_INKRUN on port 5282 ...
set PORT=5282
set VQ_OPEN=1
node server.js
pause
