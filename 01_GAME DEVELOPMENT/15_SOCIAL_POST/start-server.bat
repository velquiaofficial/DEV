@echo off
cd /d "%~dp0"
echo Starting 15_SOCIAL_POST on port 5615 ...
set PORT=5615
set VQ_OPEN=1
node server.js
pause
