@echo off
cd /d "%~dp0"
echo Starting 125_MEADOWFOLD on port 5225 ...
set PORT=5225
set VQ_OPEN=1
node server.js
pause
