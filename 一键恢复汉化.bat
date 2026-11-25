@echo off
title Antigravity 简体中文汉化一键应用与恢复
echo ====================================================
echo        Antigravity 简体中文汉化一键应用/恢复程序
echo ====================================================
echo.
where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未检测到 Node.js 运行环境。
  echo 请先前往 https://nodejs.org/ 下载安装 Node.js ^(建议 LTS 版本^) 后重试。
  echo.
  pause
  exit /b 1
)

if not exist "%~dp0node_modules\@electron\asar\bin\asar.mjs" (
  where npm >nul 2>&1
  if not errorlevel 1 (
    echo [首次准备] 正在安装依赖 @electron/asar@4.3.2 ...
    pushd "%~dp0"
    call npm install --no-fund --no-audit
    popd
    echo.
  )
)

echo 正在检查 Antigravity 是否在后台运行...
tasklist /fi "imagename eq Antigravity.exe" | findstr /i "Antigravity.exe" >nul
if not errorlevel 1 goto RUNNING
goto NEXT_STEP

:RUNNING
echo [提示] 检测到 Antigravity 正在运行或在系统托盘常驻。
echo 正在自动安全退出所有残留的 Antigravity 进程...
taskkill /f /im Antigravity.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo [完成] 后台进程已完全清理。

:NEXT_STEP
echo.
echo 正在应用最新简体中文汉化补丁...
node "%~dp0apply-antigravity-zh.mjs" %*

echo.
if errorlevel 1 goto ERROR

echo 正在配置每次开机与启动时自动检查汉化...
node "%~dp0setup-autostart.mjs" enable %*
echo.
if errorlevel 1 (
  echo [警告] 汉化已注入成功，但自动启动项配置失败，可稍后单独运行 开启自动汉化.bat。
)
goto SUCCESS

:ERROR
echo [错误] 补丁应用失败，请检查上方报错信息。
goto END

:SUCCESS
echo ====================================================
echo [成功] 最新汉化已注入，且已配置每次开机/启动自动检查！
echo 现在您可以重新打开 Antigravity 桌面端（或桌面「Antigravity (自动汉化)」图标）！
echo ====================================================

:END
echo.
pause
