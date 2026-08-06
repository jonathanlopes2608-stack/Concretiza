@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title Concretiza - Reiniciar
echo ========================================
echo   Concretiza - reiniciando (porta 3047)
echo ========================================

rem Encerra apenas processos LISTENING na porta 3047
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":3047 .*LISTENING"') do (
  echo [..] Encerrando PID %%p na porta 3047...
  taskkill /PID %%p /F >nul 2>&1
)

timeout /t 2 /nobreak >nul
call "%~dp0inicia.bat"
