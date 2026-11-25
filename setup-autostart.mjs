#!/usr/bin/env node
/**
 * 配置或取消 Windows 自动汉化启动项：
 * 1. Windows 任务计划程序开机/登录静默自检（避免被管家软件拦截 Run 注册表项）
 * 2. 生成启动器并默认接管桌面原 Antigravity 快捷方式（保留原启动参数，同时创建「Antigravity (自动汉化)」图标）
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { resolveAntigravityPaths, resolveAntigravityExecutable } from './locate-antigravity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const action = (argv.find(a => ['enable', 'disable', 'status'].includes(a)) || 'status').toLowerCase();
const noReplaceShortcut = argv.includes('--no-replace-shortcut');
const dirArgs = argv.filter(a => !['enable', 'disable', 'status', '--replace-shortcut', '--no-replace-shortcut'].includes(a));

if (process.platform !== 'win32') {
  console.error('[提示] setup-autostart.mjs 目前仅支持 Windows 自动启动配置。');
  process.exit(1);
}

const TASK_NAME = 'AntigravityZhAutoPatch';
const REG_RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const REG_LENOVO_DISABLED = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\LenovoDisabled';
const REG_VALUE_NAME = 'AntigravityZhAutoPatch';
const startupVbs = path.join(__dirname, 'startup-check.vbs');
const launchVbs = path.join(__dirname, 'launch-antigravity.vbs');
const wscriptExe = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'wscript.exe');

function getSpecialFolder(name) {
  try {
    return execFileSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', `[Environment]::GetFolderPath('${name}')`],
      { encoding: 'utf8' }
    ).trim();
  } catch (e) {
    return '';
  }
}

const desktopDir = getSpecialFolder('Desktop') || path.join(process.env.USERPROFILE || '', 'Desktop');
const startMenuProgramsDir = getSpecialFolder('Programs') || path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs');
const desktopAutoLnk = path.join(desktopDir, 'Antigravity (自动汉化).lnk');
const startMenuAutoLnk = path.join(startMenuProgramsDir, 'Antigravity (自动汉化).lnk');
const desktopOrigLnk = path.join(desktopDir, 'Antigravity.lnk');
const desktopOrigBak = path.join(desktopDir, 'Antigravity.orig.lnk.bak');

function readShortcutInfo(lnkPath) {
  if (!fs.existsSync(lnkPath)) return null;
  try {
    const ps = `
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut('${lnkPath.replace(/'/g, "''")}')
Write-Output ($sc.TargetPath + [char]9 + $sc.Arguments)
`;
    const out = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    const [targetPath = '', args = ''] = out.split('\t');
    return { targetPath, args };
  } catch (e) {
    return null;
  }
}

function createShortcut(lnkPath, targetPath, args, iconPath, workingDir, description) {
  const psScript = `
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut('${lnkPath.replace(/'/g, "''")}')
$sc.TargetPath = '${targetPath.replace(/'/g, "''")}'
$sc.Arguments = '${args.replace(/'/g, "''")}'
$sc.WorkingDirectory = '${workingDir.replace(/'/g, "''")}'
$sc.Description = '${description.replace(/'/g, "''")}'
if ('${iconPath.replace(/'/g, "''")}' -ne '') { $sc.IconLocation = '${iconPath.replace(/'/g, "''")},0' }
$sc.Save()
`;
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], { stdio: 'inherit' });
}

function queryScheduledTask() {
  try {
    execFileSync('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      `Get-ScheduledTask -TaskName '${TASK_NAME}' -ErrorAction Stop | Out-Null`
    ], { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

function registerScheduledTask(vbsPath) {
  const ps = `
$action = New-ScheduledTaskAction -Execute '${wscriptExe.replace(/'/g, "''")}' -Argument '"${vbsPath.replace(/'/g, "''")}"'
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName '${TASK_NAME}' -Action $action -Trigger $trigger -Settings $settings -Description 'Antigravity 简体中文汉化开机自动检查' -Force | Out-Null
`;
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function unregisterScheduledTask() {
  try {
    execFileSync('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      `Unregister-ScheduledTask -TaskName '${TASK_NAME}' -Confirm:$false -ErrorAction SilentlyContinue`
    ], { stdio: 'ignore' });
  } catch (e) {}
}

function readRunRegistryValue(key = REG_RUN_KEY) {
  try {
    return execFileSync('reg.exe', ['query', key, '/v', REG_VALUE_NAME], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch (e) {
    return '';
  }
}

function deleteRunRegistryValues() {
  for (const key of [REG_RUN_KEY, REG_LENOVO_DISABLED]) {
    try {
      execFileSync('reg.exe', ['delete', key, '/v', REG_VALUE_NAME, '/f'], { stdio: 'ignore' });
    } catch (e) {}
  }
}

if (action === 'status') {
  const taskExists = queryScheduledTask();
  const regVal = readRunRegistryValue();
  const origInfo = readShortcutInfo(desktopOrigLnk);
  const wrappedOrig = Boolean(origInfo && origInfo.args && origInfo.args.includes('launch-antigravity.vbs'));
  console.log('=== Antigravity 自动汉化状态 ===');
  console.log('- Windows 任务计划程序 (开机/登录自检):', taskExists ? `已启用 (${TASK_NAME})` : '未启用');
  console.log('- 备用 Run 注册表项:', regVal ? `已启用 (${REG_RUN_KEY}\\${REG_VALUE_NAME})` : '未启用');
  console.log('- 开机检查脚本:', fs.existsSync(startupVbs) ? startupVbs : '未生成');
  console.log('- 桌面「Antigravity (自动汉化)」快捷方式:', fs.existsSync(desktopAutoLnk) ? desktopAutoLnk : '未创建');
  console.log('- 桌面原「Antigravity」快捷方式已接管:', wrappedOrig ? '是' : '否');
  process.exit(0);
}

if (action === 'disable') {
  unregisterScheduledTask();
  console.log(`✓ 已移除 Windows 任务计划: ${TASK_NAME}`);
  deleteRunRegistryValues();

  for (const p of [startupVbs, launchVbs, desktopAutoLnk, startMenuAutoLnk]) {
    if (fs.existsSync(p)) {
      try {
        fs.unlinkSync(p);
        console.log('✓ 已移除:', p);
      } catch (e) {}
    }
  }
  if (fs.existsSync(desktopOrigBak)) {
    fs.copyFileSync(desktopOrigBak, desktopOrigLnk);
    fs.unlinkSync(desktopOrigBak);
    console.log('✓ 已还原桌面原版 Antigravity 快捷方式');
  }
  console.log('[完成] 已关闭开机及启动自动汉化。');
  process.exit(0);
}

// enable
const { installDir } = resolveAntigravityPaths(dirArgs);
const antigravityExe = resolveAntigravityExecutable(installDir);
const nodeExe = process.execPath;
const applyScript = path.join(__dirname, 'apply-antigravity-zh.mjs');
const dirFlag = dirArgs.length > 0 ? ` --dir "${installDir}"` : '';
const dirFlagVbs = dirFlag.replace(/"/g, '""');

// 检测原桌面快捷方式中的启动参数（如 --remote-debugging-port=0）
let preservedArgs = '';
const origInfo = readShortcutInfo(desktopOrigLnk);
if (origInfo && origInfo.targetPath && origInfo.targetPath.toLowerCase().endsWith('antigravity.exe')) {
  preservedArgs = origInfo.args || '';
  if (!fs.existsSync(desktopOrigBak)) {
    fs.copyFileSync(desktopOrigLnk, desktopOrigBak);
  }
} else if (fs.existsSync(desktopOrigBak)) {
  const bakInfo = readShortcutInfo(desktopOrigBak);
  if (bakInfo && bakInfo.args) preservedArgs = bakInfo.args;
}
const launchArgsFlag = preservedArgs
  ? ` --launch-args "${preservedArgs.replace(/"/g, '\\"')}"`
  : '';
const launchArgsFlagVbs = launchArgsFlag.replace(/"/g, '""');

// 1. 生成开机登录静默自检脚本，优先通过 Windows 任务计划程序注册（不受电脑管家拦截）
const startupContent = `Set shell = CreateObject("WScript.Shell")
cmd = """${nodeExe}"" ""${applyScript}""${dirFlagVbs} --if-needed --quiet --kill"
shell.Run cmd, 0, False
`;
fs.writeFileSync(startupVbs, startupContent, 'utf8');

deleteRunRegistryValues();
try {
  registerScheduledTask(startupVbs);
  console.log(`✓ 已启用 Windows 任务计划开机自检 (${TASK_NAME})`);
} catch (taskErr) {
  const runCmdValue = `"${wscriptExe}" "${startupVbs}"`;
  execFileSync('reg.exe', ['add', REG_RUN_KEY, '/v', REG_VALUE_NAME, '/t', 'REG_SZ', '/d', runCmdValue, '/f'], {
    stdio: 'inherit'
  });
  console.log(`✓ 已启用 Windows Run 注册表开机自检 (${REG_RUN_KEY}\\${REG_VALUE_NAME})`);
}

// 2. 生成启动器脚本（每次打开 Antigravity 前极速校验并补丁，然后保留原参数启动桌面端）
const launchContent = `Set shell = CreateObject("WScript.Shell")
cmd = """${nodeExe}"" ""${applyScript}""${dirFlagVbs} --if-needed --quiet --kill --launch${launchArgsFlagVbs}"
shell.Run cmd, 0, False
`;
fs.writeFileSync(launchVbs, launchContent, 'utf8');
console.log('✓ 已生成自动汉化启动脚本:', launchVbs);

// 3. 创建快捷方式并默认接管桌面 Antigravity.lnk
try {
  createShortcut(
    desktopAutoLnk,
    wscriptExe,
    `"${launchVbs}"`,
    antigravityExe,
    __dirname,
    '启动 Antigravity（启动前自动检查并应用简体中文汉化）'
  );
  console.log('✓ 已创建桌面快捷方式:', desktopAutoLnk);
} catch (e) {
  console.warn('[提示] 未能写入桌面快捷方式:', e.message);
}

if (fs.existsSync(startMenuProgramsDir)) {
  try {
    createShortcut(
      startMenuAutoLnk,
      wscriptExe,
      `"${launchVbs}"`,
      antigravityExe,
      __dirname,
      '启动 Antigravity（启动前自动检查并应用简体中文汉化）'
    );
    console.log('✓ 已创建开始菜单快捷方式:', startMenuAutoLnk);
  } catch (e) {}
}

if (!noReplaceShortcut && fs.existsSync(desktopOrigLnk)) {
  try {
    createShortcut(
      desktopOrigLnk,
      wscriptExe,
      `"${launchVbs}"`,
      antigravityExe,
      __dirname,
      'Antigravity（自动汉化启动）'
    );
    console.log('✓ 已接管桌面 Antigravity 快捷方式（原版已备份为 Antigravity.orig.lnk.bak）');
  } catch (e) {
    console.warn('[提示] 未能接管桌面原快捷方式:', e.message);
  }
}

console.log('\n[完成] 自动汉化已配置：');
console.log('  1. 每次开机登录会自动通过 Windows 任务计划静默核对 app.asar，若因更新变回英文则自动重新汉化；');
console.log('  2. 点击桌面「Antigravity」或「Antigravity (自动汉化)」启动时，都会在打开前毫秒级核对汉化状态再启动。');
