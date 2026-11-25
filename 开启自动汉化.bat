@echo off
title Antigravity 开启每次启动自动汉化
echo ====================================================
echo          Antigravity 开启每次启动自动汉化
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

node "%~dp0setup-autostart.mjs" enable %*
echo.
if errorlevel 1 (
  echo [错误] 配置自动汉化失败，请检查上方报错信息。
) else (
  echo ====================================================
  echo [成功] 已配置开机自动检查 + 桌面「Antigravity (自动汉化)」快捷方式！
  echo ====================================================
)
echo.
pause
