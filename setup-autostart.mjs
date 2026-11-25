#!/usr/bin/env node
/**
 * 配置或取消 Windows 自动汉化启动项：
 * 1. Windows 登录自启动注册表项 (HKCU\...\Run\AntigravityZhAutoPatch)：静默检查并仅在需要时注入
 * 2. 桌面「Antigravity (自动汉化)」启动快捷方式（启动前极速检测并补丁，再拉起 Antigravity）
 */

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { resolveAntigravityPaths, resolveAntigravityExecutable } from './locate-antigravity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const action = (argv.find(a => ['enable', 'disable', 'status'].includes(a)) || 'status').toLowerCase();
const replaceOriginalShortcut = argv.includes('--replace-shortcut');
const dirArgs = argv.filter(a => !['enable', 'disable', 'status', '--replace-shortcut'].includes(a));

if (process.platform !== 'win32') {
  console.error('[提示] setup-autostart.mjs 目前仅支持 Windows 自动启动配置。');
  process.exit(1);
}

const REG_RUN_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
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

function readRunRegistryValue() {
  try {
    const out = execFileSync('reg.exe', ['query', REG_RUN_KEY, '/v', REG_VALUE_NAME], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return out.trim();
  } catch (e) {
    return '';
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

if (action === 'status') {
  const regVal = readRunRegistryValue();
  console.log('=== Antigravity 自动汉化状态 ===');
  console.log('- 开机自启注册表项:', regVal ? `已启用 (${REG_RUN_KEY}\\${REG_VALUE_NAME})` : '未启用');
  console.log('- 开机检查脚本:', fs.existsSync(startupVbs) ? startupVbs : '未生成');
  console.log('- 桌面自动汉化快捷方式:', fs.existsSync(desktopAutoLnk) ? desktopAutoLnk : '未创建');
  console.log('- 原桌面快捷方式已替换:', fs.existsSync(desktopOrigBak) ? '是' : '否');
  process.exit(0);
}

if (action === 'disable') {
  try {
    execFileSync('reg.exe', ['delete', REG_RUN_KEY, '/v', REG_VALUE_NAME, '/f'], { stdio: 'ignore' });
    console.log(`✓ 已移除开机自启注册表项: ${REG_RUN_KEY}\\${REG_VALUE_NAME}`);
  } catch (e) {}

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

// 1. 生成开机登录静默自检脚本并写入 HKCU\...\Run
const startupContent = `Set shell = CreateObject("WScript.Shell")
cmd = """${nodeExe}"" ""${applyScript}""${dirFlagVbs} --if-needed --quiet --kill"
shell.Run cmd, 0, False
`;
fs.writeFileSync(startupVbs, startupContent, 'utf8');

const runCmdValue = `"${wscriptExe}" "${startupVbs}"`;
execFileSync('reg.exe', ['add', REG_RUN_KEY, '/v', REG_VALUE_NAME, '/t', 'REG_SZ', '/d', runCmdValue, '/f'], {
  stdio: 'inherit'
});
console.log(`✓ 已启用 Windows 开机自动检查汉化 (${REG_RUN_KEY}\\${REG_VALUE_NAME})`);

// 2. 生成启动器脚本（每次打开 Antigravity 前自动检查并补丁，然后启动桌面端）
const launchContent = `Set shell = CreateObject("WScript.Shell")
cmd = """${nodeExe}"" ""${applyScript}""${dirFlagVbs} --if-needed --quiet --kill --launch"
shell.Run cmd, 0, False
`;
fs.writeFileSync(launchVbs, launchContent, 'utf8');
console.log('✓ 已生成自动汉化启动脚本:', launchVbs);

// 3. 创建快捷方式
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
  } catch (e) {
    // 某些受限环境不允许写开始菜单目录，忽略即可
  }
}

if (replaceOriginalShortcut && fs.existsSync(desktopOrigLnk)) {
  if (!fs.existsSync(desktopOrigBak)) {
    fs.copyFileSync(desktopOrigLnk, desktopOrigBak);
  }
  createShortcut(
    desktopOrigLnk,
    wscriptExe,
    `"${launchVbs}"`,
    antigravityExe,
    __dirname,
    'Antigravity（自动汉化启动）'
  );
  console.log('✓ 已将原桌面 Antigravity 快捷方式切换为自动汉化启动（原版已备份）');
}

console.log('\n[完成] 自动汉化已配置：');
console.log('  1. 每次开机登录会自动静默核对 app.asar，若因更新变回英文则自动重新汉化；');
console.log('  2. 以后通过桌面「Antigravity (自动汉化)」启动，每次打开前都会先毫秒级核对汉化状态再启动。');
