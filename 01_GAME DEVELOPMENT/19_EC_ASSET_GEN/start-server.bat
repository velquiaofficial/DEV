@echo off
cd /d "%~dp0"
echo Starting 19_EC_ASSET_GEN on port 5619 ...
set PORT=5619
set VQ_OPEN=1
node server.js
pause
