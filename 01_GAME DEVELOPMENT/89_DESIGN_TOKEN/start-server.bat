@echo off
cd /d "%~dp0"
echo Starting 89_DESIGN_TOKEN on port 5689 ...
set PORT=5689
set VQ_OPEN=1
node server.js
pause
