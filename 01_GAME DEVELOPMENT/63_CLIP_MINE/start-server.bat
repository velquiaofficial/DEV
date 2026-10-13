@echo off
cd /d "%~dp0"
echo Starting 63_CLIP_MINE on port 5663 ...
set PORT=5663
set VQ_OPEN=1
node server.js
pause
