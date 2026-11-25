# Antigravity 简体中文汉化补丁

面向 **Antigravity 桌面端** 的严格幂等简体中文汉化补丁，支持**自动探测安装路径**、**开机及启动时自动检测汉化**、**官方更新后自动刷新原版备份**以及**一键还原官方英文版**。

---

## 环境要求

- **Windows 10 / 11**（已安装 Antigravity 桌面端）
- **[Node.js](https://nodejs.org/) 18 及以上版本**（自带 `npm`）

---

## 在新设备上快速使用（Windows）

1. **获取仓库**
   - 方式 A（推荐）：
     ```bash
     git clone https://github.com/Johnsonfreee/antigravity-zh-patch.git
     cd antigravity-zh-patch
     ```
   - 方式 B：点击 GitHub 页面右上角 **Code → Download ZIP** 并解压到本地固定目录。

2. **一键应用汉化并启用「每次启动自动执行」**
   - 双击运行目录中的 **`一键恢复汉化.bat`**。
   - 脚本会自动完成：
     1. 检查 Node.js 环境并在首次运行时自动安装 `@electron/asar@4.3.2`；
     2. 自动结束后台残留的 `Antigravity.exe`；
     3. 自动查找 Antigravity 安装位置（支持 `%LOCALAPPDATA%\Programs\antigravity`、`Program Files\Antigravity`、环境变量、注册表等）；
     4. 备份官方原版 `app.asar` 到 `app.asar.orig`（后续 Antigravity 更新后重跑会自动刷新备份）；
     5. 注入汉化覆盖层、原生菜单、托盘、右键菜单等补丁并重新打包；
     6. 自动配置两重启动保障：
        - **Windows 开机/登录静默自检**：每次开机登录时在后台无弹窗检测 `app.asar`；已是最新汉化则 **5ms 内自动跳过**，若被官方更新覆盖则自动静默重新汉化；
        - **桌面快捷方式「Antigravity (自动汉化)」**：以后每次通过该图标启动 Antigravity，都会在打开前瞬间完成校验/补丁后再启动客户端。

3. **更多自动启动选项**
   - 若想同时把桌面原有的 `Antigravity` 图标也替换为自动汉化启动，可运行：
     ```bash
     node setup-autostart.mjs enable --replace-shortcut
     ```
   - 如需单独开启/关闭自动启动，可双击 **`开启自动汉化.bat`** / **`关闭自动汉化.bat`**（执行 `一键还原英文.bat` 时也会自动关闭自启动）。

---

## 常见问题与进阶用法

### 1. 自定义安装路径怎么办？
如果另一台电脑的 Antigravity 安装在非默认位置（例如 `D:\Software\Antigravity`），可使用以下任意一种方式：
- **拖拽运行**：直接将 `Antigravity.exe` 或安装目录拖到 `一键恢复汉化.bat` 上松开；
- **命令行指定**：
  ```bash
  node apply-antigravity-zh.mjs --dir "D:\Software\Antigravity"
  ```
- **环境变量**：设置 `ANTIGRAVITY_DIR=D:\Software\Antigravity`。

### 2. 如何还原回官方英文版？
双击运行 **`一键还原英文.bat`**（或在命令行执行 `node revert-antigravity-zh.mjs`），即可从 `app.asar.orig` 一键恢复官方纯净原版。

### 3. 如何验证补丁状态？
```bash
npm run verify
```

### 4. 如何增量补充词条？
1. 编辑 `full_dict.json` 添加词条，或在 `overlay_script.raw.js` 的 `REGEX_RULES` 中添加动态正则；
2. 运行同步脚本将最新词条打包进 `apply-antigravity-zh.mjs`：
   ```bash
   npm run sync
   ```
3. 重新运行 `一键恢复汉化.bat`（或 `npm run apply`）。

---

## 目录说明

| 文件 | 说明 |
| :--- | :--- |
| `一键恢复汉化.bat` | Windows 一键清理进程并立即应用/恢复汉化 |
| `开启自动汉化.bat` | 一键开启「开机静默自检 + 每次启动前自动校验汉化」 |
| `关闭自动汉化.bat` | 一键移除开机自检与自动汉化启动项 |
| `一键还原英文.bat` | Windows 一键从 `app.asar.orig` 还原官方英文版 |
| `apply-antigravity-zh.mjs` | 核心幂等汉化注入脚本（支持 `--if-needed` 极速校验、`--quiet`、`--kill`、`--launch`） |
| `setup-autostart.mjs` | 自动启动项与快捷方式管理工具 |
| `revert-antigravity-zh.mjs` | 还原英文版脚本 |
| `locate-antigravity.mjs` | 跨设备安装路径自动探测、ASAR 头部校验与 `@electron/asar` 定位模块 |
| `overlay_script.raw.js` | 运行时 DOM 汉化覆盖层源码（含 `LOWER_DICTIONARY` 多词大小写兼容回退） |
| `full_dict.json` | 结构化完整中英对照词典（1260+ 词条） |
| `sync-overlay.mjs` | 将 `full_dict.json` 与 `overlay_script.raw.js` 同步到安装脚本 |
| `verify-patch.mjs` | 校验已安装 `app.asar` 的语法、注入幂等性与核心翻译结果 |
| `package.json` | 锁定 `@electron/asar@4.3.2` 依赖与常用 npm 脚本 |
