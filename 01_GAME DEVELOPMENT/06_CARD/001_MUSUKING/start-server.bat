@echo off
cd /d "%~dp0"
echo Starting 001_MUSUKING on port 6770 ...
set PORT=6770
set VQ_OPEN=1
node server.js
pause
