@echo off
setlocal
cd /d "%~dp0"
title CognitiveAdapt

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js is required but was not found.
  echo  Install the LTS version from https://nodejs.org  then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist ".env" (
  copy /y ".env.example" ".env" >nul
  echo  Created .env - running in local mode. Edit .env to connect Supabase.
)

if not exist "node_modules" (
  echo  Installing dependencies ^(first run only, ~1 minute^)...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo  npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

echo.
echo  Starting CognitiveAdapt at http://localhost:3000  ^(Ctrl+C to stop^)
echo.
call npm run dev
pause
