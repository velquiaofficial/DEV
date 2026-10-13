@echo off
cd /d "%~dp0"
echo Starting 98_ROADMAP_VOTE on port 5698 ...
set PORT=5698
set VQ_OPEN=1
node server.js
pause
