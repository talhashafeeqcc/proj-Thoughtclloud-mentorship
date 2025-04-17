@echo off
echo Building frontend...
call npm run build

echo Building server...
call npm run build:server

if not exist .env (
    echo Creating production .env file...
    copy .env.example .env
    echo Please update the .env file with your production values before starting the server
)

echo Starting server...
call npm run start 