@echo off
cd /d "%~dp0"
echo Starting 214_PAPERFARM on port 5314 ...
set PORT=5314
set VQ_OPEN=1
node server.js
pause
