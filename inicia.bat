@echo off
setlocal EnableExtensions
cd /d "%~dp0"

rem Portas dedicadas da Concretiza (evita conflito com outras apps neste PC)
set PORT=3047
set APP_URL=http://localhost:3047
set DATABASE_URL=postgresql://concretiza:concretiza@localhost:5437/concretiza?schema=public

title Concretiza - Fila de Conformidade
echo.
echo ========================================
echo   Concretiza - iniciando ambiente
echo   App:  %APP_URL%
echo   DB:   localhost:5437
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado no PATH.
  pause
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env" >nul
    echo [OK] .env criado a partir de .env.example
  ) else (
    echo [ERRO] Arquivo .env e .env.example ausentes.
    pause
    exit /b 1
  )
)

if not exist "node_modules\" (
  echo [..] Instalando dependencias npm...
  call npm install
  if errorlevel 1 (
    echo [ERRO] npm install falhou.
    pause
    exit /b 1
  )
)

where docker >nul 2>&1
if errorlevel 1 (
  echo [AVISO] Docker nao encontrado — usando Postgres embutido na 5437.
  start "Concretiza-DB" cmd /c "node scripts\start-embedded-db.mjs"
  timeout /t 6 /nobreak >nul
) else (
  echo [..] Subindo Postgres da Concretiza ^(porta 5437^)...
  docker compose up -d db
  if errorlevel 1 (
    echo [AVISO] Docker compose falhou — usando Postgres embutido na 5437.
    start "Concretiza-DB" cmd /c "node scripts\start-embedded-db.mjs"
    timeout /t 6 /nobreak >nul
  ) else (
    echo [..] Aguardando banco ficar pronto...
    timeout /t 5 /nobreak >nul
  )
)

echo [..] Prisma generate...
call npx prisma generate
if errorlevel 1 (
  echo [ERRO] prisma generate falhou.
  pause
  exit /b 1
)

echo [..] Aplicando migrations...
call npx prisma migrate deploy
if errorlevel 1 (
  echo [AVISO] migrate deploy falhou. Verifique o Postgres na porta 5437.
)

echo [..] Seed ^(admin / SLA / checklist^)...
call npm run db:seed
if errorlevel 1 (
  echo [AVISO] seed falhou. Pode ja ter sido executado ou o banco esta inacessivel.
)

echo.
echo [OK] Abrindo navegador em %APP_URL%
start "" "%APP_URL%"

echo [OK] Iniciando Next.js na porta %PORT%
echo     Login seed: admin@concretiza.local / Admin@123
echo     Pare com Ctrl+C nesta janela.
echo.
call npm run dev
pause
