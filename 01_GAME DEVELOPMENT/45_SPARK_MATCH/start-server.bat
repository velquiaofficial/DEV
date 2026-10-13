@echo off
cd /d "%~dp0"
echo Starting 45_SPARK_MATCH on port 5645 ...
set PORT=5645
set VQ_OPEN=1
node server.js
pause
