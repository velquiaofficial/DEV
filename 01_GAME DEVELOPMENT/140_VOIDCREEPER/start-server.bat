@echo off
cd /d "%~dp0"
echo Starting 140_VOIDCRAWL on port 5240 ...
set PORT=5240
set VQ_OPEN=1
node server.js
pause
