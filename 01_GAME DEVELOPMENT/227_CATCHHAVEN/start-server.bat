@echo off
cd /d "%~dp0"
echo Starting 227_CATCHBAY on port 5327 ...
set PORT=5327
set VQ_OPEN=1
node server.js
pause
