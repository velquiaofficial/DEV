@echo off
cd /d "%~dp0"
echo Starting 223_DECKSPIKE on port 5323 ...
set PORT=5323
set VQ_OPEN=1
node server.js
pause
