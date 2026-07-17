@echo off
echo Starting n8n Community Edition on http://localhost:5678 ...
cd /d "%~dp0"

if exist ".env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do (
    if not "%%a"=="" set "%%a=%%b"
  )
)

where n8n >nul 2>nul
if %ERRORLEVEL%==0 (
  n8n start
) else (
  echo n8n CLI not found. Installing globally...
  call npm install -g n8n
  n8n start
)
