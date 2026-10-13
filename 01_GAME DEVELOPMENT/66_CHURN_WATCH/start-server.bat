@echo off
cd /d "%~dp0"
echo Starting 66_CHURN_WATCH on port 5666 ...
set PORT=5666
set VQ_OPEN=1
node server.js
pause
