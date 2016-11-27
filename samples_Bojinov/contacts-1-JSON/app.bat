@echo off
setlocal enabledelayedexpansion

set _DEBUG=1

rem ##########################################################################
rem ## Environment setup

set _BASENAME=%~n0

set _EXITCODE=0

for %%f in ("%~dp0") do set _ROOT_DIR=%%~sf

for %%f in ("%~dp0..") do call %%~sf\setenv.bat
if not %_EXITCODE%==0 goto end

set _NODE_CMD=node.exe
set _NODE_OPTS=

set _JQ_CMD=jq.exe
set _JQ_OPTS=

set _NODE_FILE=%_ROOT_DIR%app\%_BASENAME%.js
if not exist "%_NODE_FILE%" (
    if %_DEBUG%==1 echo [%_BASENAME%] Node source file not found ^(%_NODE_FILE%^)
	set _EXITCODE=1
	goto end
)

if exist "%_ROOT_DIR%config.json" (
    for /f %%i in ('%_JQ_CMD% .host "%_ROOT_DIR%config.json"') do set _HOST=%%~i
    for /f %%i in ('%_JQ_CMD% .port "%_ROOT_DIR%config.json"') do set _PORT=%%~i
)
if not defined _HOST set _HOST=localhost
if not defined _PORT set _PORT=8180
set _URL=http://!_HOST!:!_PORT!/groups1

rem ##########################################################################
rem ## Main

rem open url with default browser
if %_DEBUG%==1 echo [%_BASENAME%] start "" %_URL%
start "" %_URL%

if %_DEBUG%==1 echo [%_BASENAME%] %_NODE_CMD% %_NODE_OPTS% %_NODE_FILE%
%_NODE_CMD% %_NODE_OPTS% %_NODE_FILE%
if not %ERRORLEVEL%==0 (
    if %_DEBUG%==1 echo [%_BASENAME%] Node execution failed ^(%_NODE_FILE%^)
	set _EXITCODE=1
    goto end
)

goto end

rem ##########################################################################
rem ## Subroutines

rem ##########################################################################
rem ## Cleanups

:end
if %_DEBUG%==1 echo [%_BASENAME%] _EXITCODE=%_EXITCODE%
exit /b %_EXITCODE%
endlocal
