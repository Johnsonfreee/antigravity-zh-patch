import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execSync } from 'child_process';

function parseCliDirArg(argv) {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dir' || arg === '-d') {
      if (i + 1 < argv.length) return argv[i + 1];
    } else if (arg.startsWith('--dir=')) {
      return arg.slice('--dir='.length);
    } else if (!arg.startsWith('-')) {
      return arg;
    }
  }
  return '';
}

function normalizeCandidateToResources(candidatePath) {
  if (!candidatePath) return null;
  let resolved = path.resolve(candidatePath.replace(/^"+|"+$/g, ''));
  if (!fs.existsSync(resolved)) return null;

  const stat = fs.statSync(resolved);
  if (stat.isFile()) {
    if (path.basename(resolved).toLowerCase() === 'app.asar') {
      const resourcesDir = path.dirname(resolved);
      return {
        installDir: path.dirname(resourcesDir),
        resourcesDir,
        asarPath: resolved,
        origPath: path.join(resourcesDir, 'app.asar.orig')
      };
    }
    resolved = path.dirname(resolved);
  }

  const directAsar = path.join(resolved, 'app.asar');
  if (fs.existsSync(directAsar)) {
    return {
      installDir: path.dirname(resolved),
      resourcesDir: resolved,
      asarPath: directAsar,
      origPath: path.join(resolved, 'app.asar.orig')
    };
  }

  const subResources = path.join(resolved, 'resources');
  if (fs.existsSync(path.join(subResources, 'app.asar'))) {
    return {
      installDir: resolved,
      resourcesDir: subResources,
      asarPath: path.join(subResources, 'app.asar'),
      origPath: path.join(subResources, 'app.asar.orig')
    };
  }

  const macResources = path.join(resolved, 'Contents', 'Resources');
  if (fs.existsSync(path.join(macResources, 'app.asar'))) {
    return {
      installDir: resolved,
      resourcesDir: macResources,
      asarPath: path.join(macResources, 'app.asar'),
      origPath: path.join(macResources, 'app.asar.orig')
    };
  }

  return null;
}

function findViaPathCommand() {
  try {
    const cmd = process.platform === 'win32' ? 'where.exe antigravity' : 'which antigravity';
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const lines = out.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    for (const line of lines) {
      let cur = path.dirname(line);
      for (let depth = 0; depth < 4; depth++) {
        const hit = normalizeCandidateToResources(cur);
        if (hit) return hit;
        const parent = path.dirname(cur);
        if (parent === cur) break;
        cur = parent;
      }
    }
  } catch (e) {}
  return null;
}

function findViaWindowsRegistry() {
  if (process.platform !== 'win32') return null;
  const regKeys = [
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
  ];
  for (const key of regKeys) {
    try {
      const out = execSync(`reg query "${key}" /s /f "Antigravity" /d`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      });
      const matches = out.match(/[A-Za-z]:\\[^\r\n"]+/g) || [];
      for (const p of matches) {
        const cleaned = p.replace(/,0$/, '').trim();
        const hit = normalizeCandidateToResources(cleaned);
        if (hit) return hit;
      }
    } catch (e) {}
  }
  return null;
}

export function resolveAntigravityPaths(argv = process.argv.slice(2)) {
  const cliArg = parseCliDirArg(argv);
  if (cliArg) {
    const hit = normalizeCandidateToResources(cliArg);
    if (!hit) {
      console.error('[错误] 指定的目录或文件中未找到 Antigravity 的 resources/app.asar: ' + cliArg);
      process.exit(1);
    }
    return hit;
  }

  const envCandidates = [
    process.env.ANTIGRAVITY_RESOURCES_DIR,
    process.env.ANTIGRAVITY_DIR
  ].filter(Boolean);

  for (const envPath of envCandidates) {
    const hit = normalizeCandidateToResources(envPath);
    if (hit) return hit;
  }

  const platformCandidates = [];
  if (process.platform === 'win32') {
    if (process.env.LOCALAPPDATA) {
      platformCandidates.push(
        path.join(process.env.LOCALAPPDATA, 'Programs', 'antigravity'),
        path.join(process.env.LOCALAPPDATA, 'Programs', 'Antigravity')
      );
    }
    platformCandidates.push(
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'antigravity'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Antigravity')
    );
    if (process.env.ProgramFiles) {
      platformCandidates.push(path.join(process.env.ProgramFiles, 'Antigravity'));
    }
    if (process.env['ProgramFiles(x86)']) {
      platformCandidates.push(path.join(process.env['ProgramFiles(x86)'], 'Antigravity'));
    }
  } else if (process.platform === 'darwin') {
    platformCandidates.push(
      '/Applications/Antigravity.app',
      path.join(os.homedir(), 'Applications', 'Antigravity.app')
    );
  } else {
    platformCandidates.push(
      '/opt/Antigravity',
      '/usr/lib/antigravity',
      '/usr/share/antigravity',
      path.join(os.homedir(), '.local', 'share', 'Antigravity')
    );
  }

  for (const cand of platformCandidates) {
    const hit = normalizeCandidateToResources(cand);
    if (hit) return hit;
  }

  const pathHit = findViaPathCommand();
  if (pathHit) return pathHit;

  const regHit = findViaWindowsRegistry();
  if (regHit) return regHit;

  console.error('[错误] 未能自动定位 Antigravity 安装目录（未找到 resources/app.asar）。');
  console.error('请通过以下任一方式指定安装路径后重试：');
  console.error('  1) 命令行指定: node apply-antigravity-zh.mjs --dir "D:\\你的安装路径\\antigravity"');
  console.error('  2) 环境变量:   设置 ANTIGRAVITY_DIR 为 Antigravity 安装目录');
  console.error('  3) 拖拽使用:   直接将 Antigravity.exe 或其安装文件夹拖到 一键恢复汉化.bat 上');
  process.exit(1);
}

export function resolveAntigravityExecutable(installDir) {
  if (process.platform === 'win32') {
    const exe = path.join(installDir, 'Antigravity.exe');
    if (fs.existsSync(exe)) return exe;
  } else if (process.platform === 'darwin') {
    const macExe = path.join(installDir, 'Contents', 'MacOS', 'Antigravity');
    if (fs.existsSync(macExe)) return macExe;
  } else {
    const linuxExe = path.join(installDir, 'antigravity');
    if (fs.existsSync(linuxExe)) return linuxExe;
  }
  return '';
}

export function resolveAsarPrefix(scriptDir) {
  const candidates = [];
  if (scriptDir) {
    candidates.push(path.join(scriptDir, 'node_modules', '@electron', 'asar', 'bin', 'asar.mjs'));
  }
  candidates.push(path.join(process.cwd(), 'node_modules', '@electron', 'asar', 'bin', 'asar.mjs'));

  const npxRoots = [];
  if (process.env.LOCALAPPDATA) {
    npxRoots.push(path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx'));
  }
  npxRoots.push(path.join(os.homedir(), '.npm', '_npx'));

  for (const npxRoot of npxRoots) {
    if (fs.existsSync(npxRoot)) {
      try {
        for (const entry of fs.readdirSync(npxRoot)) {
          candidates.push(path.join(npxRoot, entry, 'node_modules', '@electron', 'asar', 'bin', 'asar.mjs'));
        }
      } catch (e) {}
    }
  }

  for (const binPath of candidates) {
    if (fs.existsSync(binPath)) {
      return `"${process.execPath}" "${binPath}"`;
    }
  }
  return 'npx --yes @electron/asar@4.3.2';
}

/**
 * 极速读取 app.asar 头部，判断指定文件是否存在并核对 SHA-256（约 2ms，无需解包）
 */
export function inspectAsarEntry(asarPath, relParts) {
  let fd;
  try {
    fd = fs.openSync(asarPath, 'r');
    const hdr = Buffer.alloc(16);
    if (fs.readSync(fd, hdr, 0, 16, 0) < 16) return null;
    const headerSize = hdr.readUInt32LE(4);
    const jsonLen = hdr.readUInt32LE(12);
    const jsonBuf = Buffer.alloc(jsonLen);
    fs.readSync(fd, jsonBuf, 0, jsonLen, 16);
    let node = JSON.parse(jsonBuf.toString('utf8'));
    for (const part of relParts) {
      if (!node || !node.files || !node.files[part]) return null;
      node = node.files[part];
    }
    let sha256 = node.integrity?.hash || '';
    if (!sha256 && typeof node.offset !== 'undefined' && typeof node.size === 'number') {
      const dataBuf = Buffer.alloc(node.size);
      fs.readSync(fd, dataBuf, 0, node.size, 8 + headerSize + Number(node.offset));
      sha256 = crypto.createHash('sha256').update(dataBuf).digest('hex');
    }
    return { size: node.size, sha256 };
  } catch (e) {
    return null;
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch (e) {}
    }
  }
}
