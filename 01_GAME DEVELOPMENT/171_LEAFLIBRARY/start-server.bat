@echo off
cd /d "%~dp0"
echo Starting 171_LEAFLORE on port 5271 ...
set PORT=5271
set VQ_OPEN=1
node server.js
pause
