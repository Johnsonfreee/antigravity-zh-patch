#!/usr/bin/env node
/**
 * Antigravity Simplified Chinese Localization Installer (Strictly Idempotent)
 * 自动汉化安装脚本（支持跨设备自动探测安装目录、--if-needed 极速自检、自动刷新新版备份）
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import {
  resolveAntigravityPaths,
  resolveAntigravityExecutable,
  resolveAsarPrefix,
  inspectAsarEntry
} from './locate-antigravity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawArgs = process.argv.slice(2);
const flagSet = new Set(['--if-needed', '--quiet', '--kill', '--launch', '--force']);
const ifNeeded = rawArgs.includes('--if-needed') && !rawArgs.includes('--force');
const quiet = rawArgs.includes('--quiet');
const killIfRunning = rawArgs.includes('--kill');
const launchAfter = rawArgs.includes('--launch');
const dirArgs = rawArgs.filter(a => !flagSet.has(a));

const { installDir: INSTALL_DIR, asarPath: ASAR_PATH, origPath: ORIG_PATH } = resolveAntigravityPaths(dirArgs);
const ASAR_CMD = resolveAsarPrefix(__dirname);

const log = (...args) => { if (!quiet) console.log(...args); };

function launchAntigravityApp() {
  if (!launchAfter) return;
  const exePath = resolveAntigravityExecutable(INSTALL_DIR);
  if (!exePath) {
    console.warn('[警告] 未找到可启动的 Antigravity 可执行文件。');
    return;
  }
  const child = spawn(exePath, [], {
    detached: true,
    stdio: 'ignore',
    windowsHide: false
  });
  child.unref();
}

function killAntigravityIfRunning() {
  if (!killIfRunning || process.platform !== 'win32') return;
  try {
    const out = execSync('tasklist /fi "imagename eq Antigravity.exe"', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    if (/Antigravity\.exe/i.test(out)) {
      log('[提示] 检测到 Antigravity 正在运行，正在关闭以更新汉化...');
      execSync('taskkill /f /im Antigravity.exe', { stdio: 'ignore' });
      const until = Date.now() + 1800;
      while (Date.now() < until) {}
    }
  } catch (e) {}
}

// 准备覆盖层代码（前置以便 --if-needed 毫秒级比对哈希）
const OVERLAY_CODE = "(function() {\n  if (window.__agyZhInstalled) return;\n  window.__agyZhInstalled = true;\n\n  // 1. 词典配置\n  const DICTIONARY = {\"File\":\"文件\",\"Edit\":\"编辑\",\"View\":\"查看\",\"Window\":\"窗口\",\"Help\":\"帮助\",\"New Window\":\"新建窗口\",\"Open in New Window\":\"在新窗口中打开\",\"Close Window\":\"关闭窗口\",\"Check for Updates\":\"检查更新\",\"Check for Updates...\":\"检查更新...\",\"Checking for Updates...\":\"正在检查更新...\",\"Update Available\":\"有可用更新\",\"Update Not Available\":\"当前已是最新版本\",\"Restart to Update\":\"重启以更新\",\"Downloading Update\":\"正在下载更新\",\"Docs\":\"文档\",\"Documentation\":\"官方文档\",\"Actual Size\":\"实际大小\",\"Reset Zoom\":\"重置缩放\",\"Zoom In\":\"放大\",\"Zoom Out\":\"缩小\",\"Connect to WSL\":\"连接到 WSL\",\"Reopen Locally\":\"在本地重新打开\",\"Open Antigravity\":\"打开 Antigravity\",\"Quit\":\"退出\",\"Quit Antigravity\":\"退出 Antigravity\",\"Exit\":\"退出\",\"Close\":\"关闭\",\"Minimize\":\"最小化\",\"Maximize\":\"最大化\",\"Toggle Full Screen\":\"切换全屏\",\"Reload\":\"重新加载\",\"Force Reload\":\"强制重新加载\",\"Toggle Developer Tools\":\"切换开发者工具\",\"Developer Tools\":\"开发者工具\",\"Running Agents\":\"运行中的智能体\",\"No agents running\":\"没有正在运行的智能体\",\"1 agent running\":\"1 个智能体运行中\",\"Cut\":\"剪切\",\"Copy\":\"复制\",\"Paste\":\"粘贴\",\"Paste and Match Style\":\"粘贴并匹配样式\",\"Select All\":\"全选\",\"Undo\":\"撤消\",\"Redo\":\"重做\",\"Speech\":\"语音\",\"Start Speaking\":\"开始朗读\",\"Stop Speaking\":\"停止朗读\",\"Hide Antigravity\":\"隐藏 Antigravity\",\"Hide Others\":\"隐藏其他\",\"Show All\":\"显示全部\",\"Services\":\"服务\",\"Bring All to Front\":\"前置全部窗口\",\"Conversations\":\"对话\",\"All Conversations\":\"所有对话\",\"Recent Conversations\":\"最近对话\",\"Recent\":\"最近\",\"History\":\"历史记录\",\"New Conversation\":\"新建对话\",\"Delete Conversation\":\"删除对话\",\"Rename Conversation\":\"重命名对话\",\"Duplicate Conversation\":\"创建对话副本\",\"Pin Conversation\":\"置顶对话\",\"Unpin Conversation\":\"取消置顶\",\"Search conversations\":\"搜索对话\",\"Search conversations...\":\"搜索对话...\",\"Open Conversation Picker\":\"打开对话选择器\",\"Conversation Picker\":\"对话选择器\",\"No conversations yet\":\"暂无对话\",\"No conversations found\":\"未找到对话\",\"New Group\":\"新建分组\",\"Remove from Group\":\"从分组中移除\",\"Delete Group\":\"删除分组\",\"Workspaces\":\"工作区\",\"Workspace\":\"工作区\",\"Open Workspace\":\"打开工作区\",\"Open Workspace...\":\"打开工作区...\",\"Open Folder...\":\"打开文件夹...\",\"Open Workspace Selector\":\"打开工作区选择器\",\"Select or enter a workspace URI\":\"选择或输入工作区 URI\",\"Add Workspace\":\"添加工作区\",\"Remove Workspace\":\"移除工作区\",\"Projects\":\"项目\",\"Project\":\"项目\",\"Create Project\":\"创建项目\",\"New Project\":\"新建项目\",\"Project Settings\":\"项目设置\",\"Archive project\":\"归档项目\",\"Unarchive project\":\"取消归档项目\",\"Side Panel\":\"侧边栏\",\"Open in Side Panel\":\"在侧边栏打开\",\"Toggle Side Panel\":\"切换侧边栏\",\"Close Side Panel\":\"关闭侧边栏\",\"Collapse\":\"折叠\",\"Expand\":\"展开\",\"Collapse All\":\"全部折叠\",\"Expand All\":\"全部展开\",\"Close Tab\":\"关闭标签页\",\"Close All Tabs\":\"关闭所有标签页\",\"Close Other Tabs\":\"关闭其他标签页\",\"Close Tabs to the Right\":\"关闭右侧标签页\",\"Split Right\":\"向右拆分\",\"Split Down\":\"向下拆分\",\"Split Up\":\"向上拆分\",\"Split Left\":\"向左拆分\",\"Back\":\"返回\",\"Forward\":\"前进\",\"Refresh\":\"刷新\",\"Home\":\"主页\",\"Overview\":\"概览\",\"Navigation\":\"导航\",\"Next Page\":\"下一页\",\"Previous Page\":\"上一页\",\"See more results\":\"查看更多结果\",\"Custom View\":\"自定义视图\",\"Settings\":\"设置\",\"Open Settings\":\"打开设置\",\"Coordinator settings\":\"协调者设置\",\"Link Settings\":\"关联设置\",\"Advanced Settings\":\"高级设置\",\"Settings Unavailable\":\"设置不可用\",\"Preferences\":\"首选项\",\"General\":\"常规\",\"Appearance\":\"外观\",\"Theme\":\"主题\",\"Themes\":\"主题列表\",\"Color Theme\":\"颜色主题\",\"Dark Theme\":\"深色主题\",\"Light Theme\":\"浅色主题\",\"Dark\":\"深色\",\"Light\":\"浅色\",\"System\":\"跟随系统\",\"System default\":\"系统默认\",\"Auto (detected)\":\"自动（已检测）\",\"Configure the agent's visual theme and display preferences.\":\"配置智能体的界面主题和显示偏好。\",\"Toggle Between Light/Dark Themes\":\"在浅色/深色主题之间切换\",\"Font Size\":\"字体大小\",\"Font Family\":\"字体\",\"Line Height\":\"行高\",\"Zoom Level\":\"缩放级别\",\"Accent\":\"强调色\",\"Accent Color\":\"强调颜色\",\"Sound\":\"声音\",\"Sound Effects\":\"声音效果\",\"Voice\":\"语音\",\"Toggle Thumbnails\":\"切换缩略图\",\"Enable Notifications\":\"启用通知\",\"Notification Settings\":\"通知设置\",\"Model\":\"模型\",\"Models\":\"模型列表\",\"Model Selection\":\"模型选择\",\"Current Model\":\"当前模型\",\"Default Model\":\"默认模型\",\"Toggle Model Selector\":\"切换模型选择器\",\"Select another model\":\"选择其他模型\",\"No Model Selected\":\"未选择模型\",\"Model Quota\":\"模型配额\",\"Model Credits\":\"模型额度\",\"Quota\":\"配额\",\"Credits\":\"额度\",\"Manage your model quota and credits.\":\"管理您的模型配额与额度。\",\"Model quota reached\":\"已达到模型配额限制\",\"Baseline model quota reached\":\"已达到基础模型配额限制\",\"No quota information available.\":\"暂无配额信息。\",\"Context Window\":\"上下文窗口\",\"Context and Quota Indicator\":\"上下文与配额指示器\",\"Refresh quota and credits data\":\"刷新配额与额度数据\",\"Context Providers\":\"上下文提供者\",\"Remaining\":\"剩余\",\"Used\":\"已用\",\"Reset Time\":\"重置时间\",\"Resets in\":\"重置倒计时\",\"Usage\":\"用量\",\"Total Usage\":\"总用量\",\"Customizations\":\"自定义项\",\"Default Customizations\":\"默认自定义配置\",\"Include Jetski Default Customizations\":\"包含内置默认自定义配置\",\"Rules\":\"规则\",\"Skills\":\"技能\",\"Plugins\":\"插件\",\"Hooks\":\"钩子\",\"Manage Hooks\":\"管理钩子\",\"MCP Servers\":\"MCP 服务器\",\"MCP Tools\":\"MCP 工具\",\"Automations\":\"自动化\",\"Scheduled Tasks\":\"定时任务\",\"Custom Agents\":\"自定义智能体\",\"Extensions\":\"扩展\",\"UI Extensions\":\"界面扩展\",\"Connectors\":\"连接器\",\"Permissions\":\"权限\",\"Permission Settings\":\"权限设置\",\"Permission Details\":\"权限详情\",\"Permission Preset\":\"权限预设\",\"Local Permissions\":\"本地权限\",\"Tool Permissions\":\"工具权限\",\"Network Permissions\":\"网络权限\",\"File Permissions\":\"文件权限\",\"Configure workspace-specific permissions, resources, and customizations.\":\"配置特定工作区的权限、资源和自定义项。\",\"Controls permissions for remote conversations.\":\"控制远程对话的权限。\",\"Security\":\"安全\",\"Sandbox\":\"沙箱\",\"Enable Sandbox Mode\":\"启用沙箱模式\",\"Enable Terminal Sandbox\":\"启用终端沙箱\",\"Run terminal commands with sandbox restrictions.\":\"在沙箱限制下运行终端命令。\",\"Sandbox Allow Network\":\"允许沙箱网络访问\",\"Allow sandboxed commands to make network requests.\":\"允许沙盒命令发起网络请求。\",\"Commands Outside Sandbox\":\"沙箱外命令\",\"Configure allowed commands outside the sandbox.\":\"配置允许在沙箱外运行的命令。\",\"Unsandboxed commands\":\"非沙箱命令\",\"Allow/deny agent command execution outside the sandbox.\":\"允许/拒绝智能体在沙箱外执行命令。\",\"Controls the actions the agent can take.\":\"控制智能体可以执行的操作。\",\"Restricts agent tools to a secure, isolated local sandbox.\":\"将智能体工具限制在安全隔离的本地沙箱中。\",\"Agent Non-Workspace File Access\":\"智能体访问工作区外文件\",\"Allow/deny agent read access to specific files or directories.\":\"允许/拒绝智能体读取特定文件或目录。\",\"Allow/deny agent write access to specific files or directories.\":\"允许/拒绝智能体写入特定文件或目录。\",\"Allow/deny agent read access to specific URLs or domains.\":\"允许/拒绝智能体访问特定网址或域名。\",\"Allow/deny specific terminal commands.\":\"允许/拒绝特定的终端命令。\",\"Account\":\"账户\",\"Accounts\":\"账号\",\"Profile\":\"个人资料\",\"Sign In\":\"登录\",\"Sign Out\":\"退出登录\",\"Sign in to finish setting up this plugin.\":\"登录以完成此插件的配置。\",\"Sign In with Google\":\"通过 Google 账号登录\",\"Go to Accounts\":\"前往账户设置\",\"Account connection was not completed.\":\"账户连接未完成。\",\"Add account\":\"添加账户\",\"Manage Accounts\":\"管理账户\",\"Connected\":\"已连接\",\"Disconnected\":\"未连接\",\"Account connected.\":\"账户已连接。\",\"Continue with different account\":\"使用其他账户继续\",\"If you add multiple accounts, MCP servers use the one marked Default.\":\"如果添加多个账户，MCP 服务器将使用标记为默认的账户。\",\"Enter authorization code...\":\"输入授权码...\",\"Authorization code was rejected. Paste a fresh code and try again.\":\"授权码被拒绝。请粘贴最新的授权码后重试。\",\"Remote\":\"远程\",\"Remote Control\":\"远程控制\",\"Enable Remote Control\":\"启用远程控制\",\"Device Name\":\"设备名称\",\"Enter device name...\":\"输入设备名称...\",\"Open in Remote Control\":\"在远程控制中打开\",\"Continue your work from another device with Remote Control. Scan the QR code or open the link below.\":\"使用远程控制在另一台设备上继续工作。请扫描二维码或打开下方链接。\",\"This Computer\":\"本地计算机\",\"Application\":\"应用程序\",\"Global\":\"全局\",\"Advanced\":\"高级\",\"Developer-only tools. These settings do not affect other users.\":\"仅限开发者工具。这些设置不会影响其他用户。\",\"Keyboard Shortcuts\":\"键盘快捷键\",\"Keybindings\":\"快捷键绑定\",\"Edit Shortcut\":\"编辑快捷键\",\"Add Shortcut\":\"添加快捷键\",\"Remove Shortcut\":\"移除快捷键\",\"Reset to Default\":\"恢复为默认值\",\"Reset to Defaults\":\"恢复所有默认值\",\"Telemetry\":\"遥测\",\"Telemetry is disabled in Settings\":\"设置中已禁用遥测\",\"Feedback\":\"反馈\",\"Provide Feedback\":\"提供反馈\",\"Give Feedback\":\"提交反馈\",\"General Feedback\":\"常规反馈\",\"Feedback Type\":\"反馈类型\",\"Send feedback as\":\"发送反馈身份\",\"Enter your feedback here...\":\"在此输入您的反馈...\",\"For any feedback that does not fit into the above categories.\":\"适用于不属于上述类别的任何反馈。\",\"Thank you! Your feedback has been submitted successfully.\":\"感谢您！您的反馈已成功提交。\",\"An error occurred while submitting your feedback. Please try again.\":\"提交反馈时出错。请重试。\",\"About\":\"关于\",\"About Antigravity\":\"关于 Antigravity\",\"Version\":\"版本\",\"Voice mode\":\"语音模式\",\"The voice used in Voice mode. Powered by Gemini Live.\":\"语音模式下使用的声音。由 Gemini Live 提供支持。\",\"The voice Jetski speaks with.\":\"智能体使用的语音。由 Gemini Live 提供支持。\",\"Not set\":\"未设置\",\"Change\":\"更改\",\"Microphone\":\"麦克风\",\"Input device for voice mode and dictation.\":\"语音模式与听写使用的输入设备。\",\"How loud Antigravity's voice is.\":\"Antigravity 的语音音量大小。\",\"How loud Jetski's voice is.\":\"智能体的语音音量大小。\",\"Start Voice mode\":\"开始语音模式\",\"End Voice mode\":\"结束语音模式\",\"Start Live Chat\":\"开始实时通话\",\"End Live chat\":\"结束实时聊天\",\"Unmute mic\":\"取消麦克风静音\",\"Mute mic\":\"麦克风静音\",\"Voice volume\":\"语音音量\",\"Chime volume\":\"提示声音量\",\"Shortcuts\":\"快捷键\",\"Keyboard shortcuts for quick navigation and control.\":\"用于快速导航与控制的键盘快捷键。\",\"Search shortcuts...\":\"搜索快捷键...\",\"Search shortcuts\":\"搜索快捷键\",\"Reset All to Defaults\":\"全部恢复为默认值\",\"Reset all to defaults\":\"全部恢复为默认值\",\"Notifications\":\"通知\",\"Manage your notification preferences.\":\"管理您的通知偏好设置。\",\"Enable Notifications for Agent\":\"启用智能体通知\",\"Show system notifications when your action is needed or the agent finishes.\":\"当需要您操作或智能体完成任务时显示系统通知。\",\"Enable Sounds for Agent\":\"启用智能体声音提示\",\"Play a sound when your action is needed or the agent finishes.\":\"当需要您操作或智能体完成任务时播放提示音。\",\"Set the volume of agent sounds.\":\"设置智能体提示音的音量。\",\"Enable AI Credit Overages\":\"允许使用超额 AI 额度\",\"When toggled on, Antigravity will use your AI credits to fulfill model requests once you're out of model quota. Antigravity will always use your model quota first before using AI credits.\":\"开启后，当模型配额用尽时，Antigravity 将使用您的 AI 额度来处理模型请求。Antigravity 始终会先使用模型配额，然后再使用 AI 额度。\",\"When toggled on, Jetski will use your AI credits to fulfill model requests once you're out of model quota. Jetski will always use your model quota first before using AI credits.\":\"开启后，当模型配额用尽时，智能体将使用您的 AI 额度来处理模型请求。智能体始终会先使用模型配额，然后再使用 AI 额度。\",\"Gemini Models\":\"Gemini 模型\",\"Claude and GPT models\":\"Claude 与 GPT 模型\",\"Weekly Limit Remaining\":\"每周剩余额度\",\"Five Hour Limit Remaining\":\"5 小时剩余额度\",\"Daily Limit Remaining\":\"每日剩余额度\",\"Weekly limit\":\"每周额度\",\"Daily limit\":\"每日额度\",\"5-hour limit\":\"5 小时额度\",\"Conversation Steps\":\"对话步骤\",\"Choose how much detail is shown during a conversation.\":\"选择对话期间显示的详细程度。\",\"Verbose\":\"详细\",\"The agent always asks for review.\":\"智能体始终请求审阅。\",\"No automations yet\":\"暂无自动化任务\",\"Run a prompt on a schedule, like a morning summary of yesterday's changes. Runs show up here.\":\"按计划定时运行提示词，例如在早晨总结昨天的更改。运行记录将显示在此处。\",\"automations\":\"自动化任务\",\"Accept Step\":\"接受此步骤\",\"Add to Chat\":\"添加到对话\",\"Add to Chat/Quote\":\"添加到对话/引用\",\"Announcements and tips\":\"公告与提示\",\"Archive / Restore\":\"归档 / 恢复\",\"Archive This Conversation\":\"归档此对话\",\"Artifacts\":\"产物\",\"Author\":\"作者\",\"Background Tasks\":\"后台任务\",\"Best-of-N Ended\":\"Best-of-N 已结束\",\"Best-of-N Started\":\"Best-of-N 已开始\",\"Branch\":\"分支\",\"Browser Use\":\"浏览器自动化\",\"Cancel Generation\":\"取消生成\",\"Close Terminal Tab\":\"关闭终端标签页\",\"Code Search\":\"代码搜索\",\"Collapse All Folders\":\"折叠所有文件夹\",\"Comment on Selection\":\"对选中内容发表评论\",\"Comments\":\"评论\",\"Complete Onboarding Step\":\"完成引导步骤\",\"Continue Response\":\"继续回复\",\"Conversation\":\"对话\",\"Copy Conversation ID\":\"复制对话 ID\",\"Copy Conversation Markdown\":\"复制对话 Markdown\",\"Copy Trajectory ID\":\"复制轨迹 ID\",\"Download Diagnostics\":\"下载诊断信息\",\"Equalize Split Panes\":\"均分拆分窗格\",\"Expand All Folders\":\"展开所有文件夹\",\"File Picker\":\"文件选择器\",\"Find in Conversation\":\"在对话中查找\",\"Find in Pane\":\"在窗格中查找\",\"Focus Input\":\"聚焦输入框\",\"From\":\"来自\",\"Go Back\":\"后退\",\"Go Back in Pane\":\"在窗格中后退\",\"Go Forward\":\"前进\",\"Go Forward in Pane\":\"在窗格中前进\",\"Loading apps...\":\"正在加载应用...\",\"Loading installed plugins...\":\"正在加载已安装插件...\",\"Mark All as Read\":\"全部标记为已读\",\"Mark This Conversation as Read\":\"将此对话标记为已读\",\"Mark This Conversation as Unread\":\"将此对话标记为未读\",\"Mark as Read\":\"标记为已读\",\"Mark as Unread\":\"标记为未读\",\"Members\":\"成员\",\"Move Conversation Down\":\"下移对话\",\"Move Conversation Up\":\"上移对话\",\"Move to New Group\":\"移动到新分组\",\"Mute Voice Mic\":\"麦克风静音\",\"Mute Voice Speaker\":\"扬声器静音\",\"New Tab\":\"新建标签页\",\"New Terminal Tab\":\"新建终端标签页\",\"Next Side Panel Tab\":\"下一个侧边栏标签页\",\"Open Command Palette\":\"打开命令面板\",\"Open Commit Graph\":\"打开提交关系图\",\"Open Conversation\":\"打开对话\",\"Open Conversation History\":\"打开对话历史\",\"Open File Search\":\"打开文件搜索\",\"Open Keyboard Shortcuts\":\"打开键盘快捷键\",\"Open Trajectory Debug View\":\"打开轨迹调试视图\",\"Open in Cider\":\"在 Cider 中打开\",\"Open in Code Search\":\"在代码搜索中打开\",\"Owner\":\"所有者\",\"Pin This Conversation\":\"置顶此对话\",\"Previous Side Panel Tab\":\"上一个侧边栏标签页\",\"Quote Selection\":\"引用选中文本\",\"Refresh gcert Credentials\":\"刷新 gcert 凭据\",\"Reject Step\":\"拒绝此步骤\",\"Rename This Conversation\":\"重命名此对话\",\"Reopen Closed Tab\":\"重新打开已关闭的标签页\",\"Search Conversations\":\"搜索对话\",\"Select Next Conversation\":\"选择下一个对话\",\"Select Previous Conversation\":\"选择上一个对话\",\"Sent\":\"已发送\",\"Split Conversation Horizontally\":\"水平拆分对话\",\"Split Conversation Vertically\":\"垂直拆分对话\",\"Split Terminal\":\"拆分终端\",\"Start Voice Recording\":\"开始语音录制\",\"Status\":\"状态\",\"Stop Voice Recording\":\"停止语音录制\",\"Terminal: Add to Chat\":\"终端：添加到对话\",\"Toggle Environment Selector\":\"切换环境选择器\",\"Toggle File Viewer\":\"切换文件查看器\",\"Toggle Maximize Side Panel\":\"切换最大化侧边栏\",\"Toggle Overview Panel\":\"切换概览面板\",\"Toggle Project Selector\":\"切换项目选择器\",\"Toggle Sidebar\":\"切换侧边栏\",\"Toggle Terminal\":\"切换终端显示\",\"Toggle Voice Recording\":\"切换语音录制\",\"Unpin This Conversation\":\"取消置顶此对话\",\"Configure agent execution, queued message delivery, and permissions.\":\"配置智能体执行、排队消息发送以及权限。\",\"Interface Layout\":\"界面布局\",\"Knowledge Work\":\"知识工作\",\"Simplified interface for research, writing, and everyday tasks.\":\"专为研究、写作和日常任务设计的精简界面。\",\"Software Engineering\":\"软件工程\",\"Full interface for coding, developer tools, and managing agents.\":\"包含编码、开发者工具和管理智能体的完整界面。\",\"Project 4K\":\"Project 4K\",\"Project 4K interface without developer tooling.\":\"无开发者工具的精简界面。\",\"The full developer experience.\":\"完整的开发者体验。\",\"Global Permissions\":\"全局权限\",\"Configure global allowed and denied resource permissions.\":\"配置全局允许和拒绝的资源权限。\",\"Configure what the agent can do in local and remote conversations.\":\"配置智能体在本地和远程会话中可以执行的操作。\",\"Every command requires approval.\":\"所有命令都需要审批。\",\"Ask before sensitive operations.\":\"在执行敏感操作前进行询问。\",\"Run all commands without restrictions.\":\"不受限制地运行所有命令。\",\"Automatically decide if commands run.\":\"自动决定是否运行命令。\",\"Modify permissions for file, terminal, and MCP tools.\":\"修改文件、终端和 MCP 工具的权限。\",\"Modify permissions for file and terminal tools.\":\"修改文件和终端工具的权限。\",\"Configure allowed and denied URLs for reading.\":\"配置允许和拒绝读取的网址。\",\"Configure allowed terminal commands.\":\"配置允许的终端命令。\",\"Inherits your Global Permissions when working\":\"在工作时继承您的全局权限\",\"Manually customize individual settings.\":\"手动自定义各项设置。\",\"Agent Behavior\":\"智能体行为\",\"Plan Review Policy\":\"计划审阅策略\",\"Inherit Global\":\"继承全局设置\",\"Always Proceed\":\"始终继续\",\"Always Ask\":\"始终询问\",\"Modified in\":\"修改于\",\"Modified in \":\"修改于 \",\"and select\":\"并选择\",\"to have the agent generate a plan.\":\"让智能体生成计划。\",\"Execution\":\"执行\",\"Chat Input\":\"对话输入\",\"Enter to Send\":\"按 Enter 发送\",\"Send messages with the keyboard's Enter key on mobile devices.\":\"在移动设备上使用键盘的 Enter 键发送消息。\",\"Queued Messages\":\"排队消息\",\"Configure when follow-up messages are sent.\":\"配置后续消息的发送时机。\",\"Send Immediately\":\"立即发送\",\"Interrupt the agent and send immediately.\":\"打断智能体并立即发送。\",\"Queue\":\"排队\",\"Queue until after the current turn.\":\"排队等待当前轮次结束后发送。\",\"Keyboard shortcuts\":\"键盘快捷键\",\"Contrast\":\"对比度\",\"Strong\":\"增强\",\"Font\":\"字体\",\"System UI\":\"系统默认 (System UI)\",\"Google Sans\":\"Google Sans\",\"Inter\":\"Inter\",\"Conversation Width\":\"对话宽度\",\"Configure the maximum width of the conversation panel.\":\"配置对话面板的最大宽度。\",\"Narrow\":\"紧凑\",\"Wide\":\"加宽\",\"Fill\":\"撑满\",\"Markdown Artifact Width\":\"Markdown 产物宽度\",\"Configure the default width of markdown artifacts.\":\"配置 Markdown 产物的默认展示宽度。\",\"Show how full the context window is next to the send button. Click it for a breakdown and to see your model quota.\":\"在发送按钮旁显示上下文窗口的使用量。点击可查看明细及模型配额。\",\"Screen Reader Mode\":\"屏幕阅读器模式\",\"Optimize the interface and terminal output for screen readers.\":\"为屏幕阅读器优化界面和终端输出。\",\"Custom Context Menus\":\"自定义右键菜单\",\"Replace the default browser right-click menu with quick actions.\":\"将默认浏览器右键菜单替换为快捷操作。\",\"Terminal Placement\":\"终端位置\",\"Choose where terminal sessions appear.\":\"选择终端会话出现的位置。\",\"Bottom Panel\":\"底部面板\",\"Manage Antigravity app settings.\":\"管理 Antigravity 应用设置。\",\"Prevent Sleep\":\"阻止休眠\",\"Prevent the computer from sleeping while the app is running.\":\"在应用运行期间阻止计算机进入休眠状态。\",\"Keep In Menu Bar\":\"常驻托盘/菜单栏\",\"Keep the app accessible from the menu bar and running in the background when all windows are closed.\":\"在关闭所有窗口后仍保持应用在后台运行，并可通过菜单栏/托盘访问。\",\"Work with local agents from another device.\":\"从另一台设备控制本地运行的智能体。\",\"To modify notification settings, open your operating system's system preferences.\":\"如需修改通知设置，请打开操作系统的系统设置。\",\"Open System Preferences\":\"打开系统设置\",\"Windows Subsystem for Linux\":\"适用于 Linux 的 Windows 子系统 (WSL)\",\"Run the app against a Linux environment. Connecting relaunches the app into the selected WSL distro.\":\"在 Linux 环境下运行本应用。连接后将重启应用并载入选定的 WSL 发行版。\",\"App version\":\"应用版本\",\"Automatic Check for Updates\":\"自动检查更新\",\"Automatically prompt you to restart the app when a new update is available. When disabled, you can check for updates manually from the app menu.\":\"当有新版本可用时自动提示重启应用。禁用后，您仍可在应用菜单中手动检查更新。\",\"Ask anything, @ to mention, / for actions\":\"咨询任何问题，@ 提及，/ 执行操作\",\"Ask anything, @ to mention\":\"提问任何内容，输入 @ 提及\",\"Message subagent, @ to mention, / for actions\":\"向子智能体发送消息，输入 @ 提及，输入 / 执行操作\",\"Message subagent, @ to mention\":\"向子智能体发送消息，输入 @ 提及\",\"Listening. Ask anything.\":\"正在倾听，请随时提问。\",\"Please list the steps to reproduce the issue\":\"请列出重现该问题的步骤\",\"Enter tool name or server...\":\"输入工具名称或服务器...\",\"Search MCP servers by name\":\"按名称搜索 MCP 服务器\",\"Filter resources...\":\"筛选资源...\",\"Search file contents...\":\"搜索文件内容...\",\"Search for commands...\":\"搜索命令...\",\"Search for conversations...\":\"搜索对话...\",\"Search projects...\":\"搜索项目...\",\"Composer\":\"输入框\",\"Type a message...\":\"输入消息...\",\"Ask anything...\":\"随时提问...\",\"Ask Antigravity...\":\"向 Antigravity 提问...\",\"Ask a question or describe a task...\":\"提问或描述任务...\",\"Send\":\"发送\",\"Send Message\":\"发送消息\",\"Send feedback\":\"发送反馈\",\"Stop\":\"停止\",\"Stop Generating\":\"停止生成\",\"Stop Response\":\"停止响应\",\"Stop Subagent\":\"停止子智能体\",\"Thinking\":\"思考中\",\"Thinking...\":\"正在思考...\",\"Thought Process\":\"思考过程\",\"Show Thought Process\":\"显示思考过程\",\"Hide Thought Process\":\"隐藏思考过程\",\"Thought for\":\"思考用时\",\"seconds\":\"秒\",\"Chat\":\"对话\",\"Chat Layout\":\"对话布局\",\"Quote\":\"引用\",\"Copied\":\"已复制\",\"Copy Message\":\"复制消息\",\"Copy Text\":\"复制文本\",\"Copy Code\":\"复制代码\",\"Copy Path\":\"复制路径\",\"Edit Message\":\"编辑消息\",\"Delete Message\":\"删除消息\",\"Retry\":\"重试\",\"Regenerate\":\"重新生成\",\"Regenerate Response\":\"重新生成回复\",\"Share\":\"分享\",\"Share Conversation\":\"分享对话\",\"Export\":\"导出\",\"Export Conversation\":\"导出对话\",\"Export as PDF\":\"导出为 PDF\",\"Clear Conversation\":\"清空对话\",\"Clear Chat\":\"清空聊天记录\",\"Good response\":\"满意的回复\",\"Bad response\":\"不理想的回复\",\"Canceled\":\"已取消\",\"Paused\":\"已暂停\",\"Resumed\":\"已恢复\",\"Completed\":\"已完成\",\"Failed\":\"失败\",\"Error\":\"错误\",\"Errors\":\"错误列表\",\"Warning\":\"警告\",\"Warnings\":\"警告列表\",\"Info\":\"提示\",\"Success\":\"成功\",\"Suggested\":\"建议操作\",\"Slash Commands\":\"快捷斜杠命令\",\"Commands\":\"命令\",\"Pin\":\"置顶\",\"Unpin\":\"取消置顶\",\"Side Questions\":\"辅助提问\",\"Delete Side Question\":\"删除辅助提问\",\"Live chat\":\"实时聊天\",\"Files\":\"文件\",\"Modified Files\":\"已修改文件\",\"Search in Workspace\":\"在工作区中搜索\",\"Search Files\":\"搜索文件\",\"File Explorer\":\"文件资源管理器\",\"New File\":\"新建文件\",\"New Folder\":\"新建文件夹\",\"Delete File\":\"删除文件\",\"Rename File\":\"重命名文件\",\"Open File\":\"打开文件\",\"Save File\":\"保存文件\",\"Revert File\":\"还原文件\",\"Copy Relative Path\":\"复制相对路径\",\"Reveal in File Explorer\":\"在文件资源管理器中显示\",\"Reveal in Finder\":\"在访达中显示\",\"No files selected\":\"未选择文件\",\"No files found\":\"未找到文件\",\"File too large\":\"文件过大\",\"Branch Changes\":\"分支更改\",\"Staged Changes\":\"暂存的更改\",\"Unstaged Changes\":\"未暂存的更改\",\"Commit\":\"提交\",\"Commit Changes\":\"提交更改\",\"Push\":\"推送\",\"Push succeeded\":\"推送成功\",\"Pull\":\"拉取\",\"Fetch\":\"抓取\",\"Amend\":\"追加提交 (Amend)\",\"New Worktree\":\"新建工作树\",\"Fork\":\"创建分支 (Fork)\",\"Default Workspace VCS\":\"默认工作区版本控制\",\"CitC Workspace Type\":\"CitC 工作区类型\",\"View Stacked Diff\":\"查看堆叠差异\",\"View Split Diff\":\"查看分栏差异\",\"Hide Whitespace Changes\":\"隐藏空白字符更改\",\"Show Whitespace Changes\":\"显示空白字符更改\",\"Collapse Diffs\":\"折叠差异\",\"Expand Diffs\":\"展开差异\",\"Viewing Diff\":\"正在查看差异\",\"View Diff\":\"查看差异\",\"Open Diff\":\"打开差异\",\"File Diff Comments\":\"文件差异评论\",\"Toggle sidebar\":\"切换侧边栏\",\"Side Panel Preview\":\"侧边栏预览\",\"Side Pane UI Available\":\"侧边栏 UI 可用\",\"Open in Side Pane\":\"在侧边栏中打开\",\"Toggle Terminal Panel\":\"切换终端面板\",\"Close Panel\":\"关闭面板\",\"Maximize Pane\":\"最大化面板\",\"Restore Pane\":\"还原面板\",\"Artifact\":\"产物\",\"Artifact Viewer\":\"产物查看器\",\"No artifacts generated\":\"尚未生成产物\",\"No artifacts yet\":\"暂无产物\",\"Artifact updated by agent\":\"智能体更新了产物\",\"Export Artifact\":\"导出产物\",\"Failed to export artifact\":\"导出产物失败\",\"Failed to upload HTML artifact to Drive\":\"上传 HTML 产物到云端硬盘失败\",\"Plan\":\"计划\",\"Plans\":\"计划列表\",\"See Plans\":\"查看计划\",\"Review plans and walkthroughs\":\"审阅计划与演练步骤\",\"Review\":\"审阅\",\"Request Review\":\"请求审阅\",\"Review Policy\":\"审阅策略\",\"Whether the agent asks you to review its documents.\":\"智能体在修改或生成文档时是否请求审阅。\",\"Agent always asks for review.\":\"智能体始终请求审阅。\",\"Approve\":\"批准\",\"Approved\":\"已批准\",\"Deny\":\"拒绝\",\"Denied\":\"已拒绝\",\"Reject\":\"拒绝\",\"Rejected\":\"已拒绝\",\"Proceed\":\"继续执行\",\"Continue\":\"继续\",\"Apply\":\"应用\",\"Apply Changes\":\"应用更改\",\"Discard\":\"放弃\",\"Discard Changes\":\"放弃更改\",\"View Changes\":\"查看更改\",\"Preview\":\"预览\",\"Embedded web preview\":\"内嵌网页预览\",\"Preview unavailable\":\"预览不可用\",\"Diff\":\"差异对比\",\"Files Changed\":\"已修改文件\",\"Agent Edits\":\"智能体编辑\",\"Modified\":\"已修改\",\"Changes\":\"变更\",\"Documents\":\"文档\",\"Uploads\":\"上传文件\",\"Run\":\"运行\",\"Executing...\":\"正在执行...\",\"Execution output\":\"执行输出\",\"Subagents\":\"子智能体\",\"Subagent\":\"子智能体\",\"Agents\":\"智能体\",\"Agent\":\"智能体\",\"Active Agents\":\"活跃智能体\",\"Agent terminated due to error\":\"智能体因错误终止\",\"Goals\":\"目标\",\"Background Task\":\"后台任务\",\"Background Task Output\":\"后台任务输出\",\"Task\":\"任务\",\"Tasks\":\"任务列表\",\"Delete Task\":\"删除任务\",\"Cancel Task\":\"取消任务\",\"Cancel All Tasks\":\"取消所有任务\",\"Scheduled Task\":\"定时任务\",\"Schedule\":\"定时计划\",\"Change schedule\":\"更改计划\",\"On a schedule\":\"按定时计划运行\",\"Custom schedule\":\"自定义计划\",\"Scheduled\":\"已计划\",\"Not scheduled\":\"未计划\",\"Only Scheduled\":\"仅定时任务\",\"Automation\":\"自动化\",\"Run Automation\":\"运行自动化\",\"Delete Automation\":\"删除自动化\",\"Create Automation\":\"创建自动化\",\"Background tasks and terminals agents left running, across all conversations.\":\"所有对话中智能体保持运行的后台任务与终端。\",\"Refreshed credentials for all automations.\":\"已刷新所有自动化的凭据。\",\"Failed to refresh credentials\":\"刷新凭据失败\",\"Idle\":\"空闲\",\"Ready\":\"就绪\",\"In Progress\":\"进行中\",\"Running\":\"运行中\",\"Pending\":\"等待中\",\"Queued\":\"已排队\",\"Blocked\":\"已阻止\",\"Terminal\":\"终端\",\"Terminals\":\"终端列表\",\"New Terminal\":\"新建终端\",\"Kill Terminal\":\"终止终端\",\"Clear Terminal\":\"清空终端\",\"Terminal Commands\":\"终端命令\",\"Terminal Command Auto Execution\":\"终端命令自动执行\",\"Command Setup Script\":\"命令启动脚本\",\"Command Line\":\"命令行\",\"Execute Command\":\"执行命令\",\"Allow\":\"允许\",\"Always Allow\":\"始终允许\",\"Allow Once\":\"仅允许一次\",\"Block\":\"阻止\",\"Always Block\":\"始终阻止\",\"Browser\":\"浏览器\",\"Built-in Browser\":\"内置浏览器\",\"Open in Built-in Browser\":\"在内置浏览器中打开\",\"Open in External Browser\":\"在外部浏览器中打开\",\"Open in external browser\":\"在外部浏览器中打开\",\"Open Link in External Browser\":\"在外部浏览器中打开链接\",\"Browser Subagent\":\"浏览器子智能体\",\"Browser Task\":\"浏览器任务\",\"Enable Browser Tools\":\"启用浏览器工具\",\"Browser Javascript Execution Policy\":\"浏览器 JS 执行策略\",\"Browser Actuation Permissions\":\"浏览器操作权限\",\"Browser Actuation Rules\":\"浏览器操作规则\",\"Address bar\":\"地址栏\",\"Enter URL\":\"输入网址\",\"Navigate\":\"访问\",\"Inspect Element\":\"检查元素\",\"Take Screenshot\":\"截取屏幕\",\"Allow/deny agent browser actuation access to specific URLs.\":\"允许/拒绝智能体对特定网址进行浏览器自动化操作。\",\"Allow/deny agent browser file downloads from specific sites.\":\"允许/拒绝智能体从特定网站下载文件。\",\"Failed to approve browser interaction\":\"批准浏览器交互失败\",\"Failed to reject browser interaction\":\"拒绝浏览器交互失败\",\"Deny setting up browser\":\"拒绝配置浏览器\",\"Configure built-in browser, link opening, and browser subagent preferences.\":\"配置内置浏览器、链接打开方式以及浏览器子智能体偏好设置。\",\"Open Links In\":\"链接打开方式\",\"Choose where links open by default when clicked.\":\"选择点击链接时的默认打开位置。\",\"External Browser\":\"外部浏览器\",\"Download Location\":\"下载位置\",\"Folder where files downloaded in the built-in browser are saved.\":\"保存内置浏览器所下载文件的文件夹。\",\"Change...\":\"更改...\",\"Change…\":\"更改…\",\"Browsing History\":\"浏览历史\",\"Clear visited URLs and autocomplete suggestions from the built-in browser.\":\"清除内置浏览器的已访问网址和自动补全建议。\",\"Clear visited URLs and autocomplete suggestions from side panel preview.\":\"清除侧边栏预览的已访问网址和自动补全建议。\",\"Configure allowed and denied URLs for the browser subagent. It runs in the built-in browser, so no separate browser install is needed.\":\"配置浏览器子智能体允许和禁止访问的网址。它在内置浏览器中运行，无需单独安装外部浏览器。\",\"The browser subagent has been disabled.\":\"浏览器子智能体已被禁用。\",\"Console Telemetry\":\"控制台遥测\",\"Print telemetry events to DevTools console.\":\"在开发者工具控制台中输出遥测事件。\",\"Plugin\":\"插件\",\"Marketplace\":\"插件市场\",\"Agent Marketplace\":\"智能体市场\",\"Explore the plugin marketplace\":\"探索插件市场\",\"Browse and enable plugins\":\"浏览并启用插件\",\"Browse and enable plugins from the Build With Google catalog.\":\"浏览并启用 Build With Google 目录中的插件。\",\"Installed Plugins\":\"已安装插件\",\"Installed\":\"已安装\",\"Available\":\"可用\",\"Featured\":\"精选\",\"Install\":\"安装\",\"Installing...\":\"正在安装...\",\"Uninstall\":\"卸载\",\"Uninstalling...\":\"正在卸载...\",\"Enable\":\"启用\",\"Disable\":\"禁用\",\"Enabled\":\"已启用\",\"Disabled\":\"已禁用\",\"Disabled. Open the plugin page to finish setup.\":\"已禁用。请打开插件页面完成配置。\",\"Update\":\"更新\",\"Plugin update required\":\"需要更新插件\",\"App update required\":\"需要更新应用\",\"No plugin loads from this folder.\":\"此文件夹中未加载任何插件。\",\"Create a Plugin with the Agent\":\"让智能体协助创建插件\",\"Build With Google Plugins\":\"Build With Google 插件\",\"Add MCP Server\":\"添加 MCP 服务器\",\"Add MCP Servers\":\"添加多个 MCP 服务器\",\"Installed MCP Servers\":\"已安装的 MCP 服务器\",\"Refresh MCP servers\":\"刷新 MCP 服务器\",\"Configure external tools via Model Context Protocol.\":\"通过 Model Context Protocol 配置外部工具。\",\"External tools the agent can call via Model Context Protocol.\":\"智能体可通过 Model Context Protocol 调用的外部工具。\",\"MCP tools\":\"MCP 工具\",\"MCP Configuration Error:\":\"MCP 配置错误：\",\"MCP Install Error:\":\"MCP 安装错误：\",\"Rule\":\"规则\",\"File Access Rules\":\"文件访问规则\",\"Network Access Rules\":\"网络访问规则\",\"Access rules\":\"访问规则\",\"Set the rules, define the boundaries.\":\"设定规则，定义边界。\",\"Rules token budget exceeded. Large rules are demoted to path pointers.\":\"规则 Token 预算超限。过大规则已被降级为路径指针。\",\"Skills & Rules\":\"技能与规则\",\"Workflow\":\"工作流\",\"Workflows\":\"工作流列表\",\"Workflow files\":\"工作流文件\",\"Workflow runs\":\"工作流运行记录\",\"Curated sets of plugins for common workflows and roles.\":\"针对常见工作流和角色的精选插件集。\",\"Browse\":\"浏览市场\",\"Browse the Marketplace\":\"浏览插件市场\",\"Browse Connectors\":\"浏览连接器\",\"Bundles\":\"插件包\",\"More Plugins\":\"更多插件\",\"Explore other marketplace customizations\":\"探索其他插件市场的自定义项。\",\"Google Workspace\":\"Google Workspace\",\"Connect to Google Workspace, including Docs, Sheets, Slides, Drive, and Calendar.\":\"连接到 Google Workspace，包括文档 (Docs)、表格 (Sheets)、幻灯片 (Slides)、云端硬盘 (Drive) 与日历 (Calendar)。\",\"Build with Google\":\"使用 Google 构建\",\"Build on Google's developer platforms, including Android, Chrome, Gemini, and Google Cloud.\":\"在 Google 开发者平台上构建，包括 Android、Chrome、Gemini 和 Google Cloud。\",\"Design, Creative & Media\":\"设计、创意与媒体\",\"Design, creative, and media tools.\":\"设计、创意和媒体工具。\",\"Productivity & Project Management\":\"生产力与项目管理\",\"Plan work, track issues, sign documents, and manage your notes and files.\":\"规划工作、跟踪问题、签署文档，并管理您的笔记和文件。\",\"Cloud Hosting & Deployment\":\"云托管与部署\",\"Deploy and host your apps, sites, and their backends.\":\"部署和托管您的应用程序、网站及其后端。\",\"APIs, services, and tools to build, test, secure, and run your apps.\":\"用于构建、测试、保护和运行应用程序的 API、服务与工具。\",\"Business\":\"商业与业务\",\"Payments, CRM, accounting, data, identity, customer support, marketing, and workflow automation.\":\"支付、CRM、会计、数据、身份认证、客户支持、营销和工作流自动化。\",\"Add\":\"添加\",\"Add all\":\"全部添加\",\"Adding...\":\"正在添加...\",\"Removing...\":\"正在移除...\",\"Details\":\"详情\",\"Details for\":\"详情\",\"Setup required\":\"需要配置\",\"Sign in required\":\"需要登录\",\"Built In\":\"内置\",\"Starting\":\"正在启动\",\"Skill\":\"技能\",\"No description available.\":\"暂无描述。\",\"See more in Bundles\":\"在插件包中查看更多\",\"See less in Bundles\":\"在插件包中显示较少\",\"See more in Plugins\":\"在插件中查看更多\",\"See less in Plugins\":\"在插件中显示较少\",\"Find skills, agents, and more in the Marketplace.\":\"在插件市场中查找技能、智能体及更多内容。\",\"No plugins available.\":\"没有可用插件。\",\"No matching plugins found.\":\"未找到匹配的插件。\",\"Failed to load plugins. Please try again.\":\"加载插件失败，请重试。\",\"Failed to load more plugins. Please try again.\":\"加载更多插件失败，请重试。\",\"Try again\":\"重试\",\"Dependencies\":\"依赖项\",\"No accounts connected\":\"未连接任何账号\",\"Connect Account\":\"连接账号\",\"Disconnect\":\"断开连接\",\"Disconnect Account\":\"断开账号连接\",\"Save\":\"保存\",\"Save Changes\":\"保存更改\",\"Save As...\":\"另存为...\",\"Save All\":\"全部保存\",\"Cancel\":\"取消\",\"Confirm\":\"确认\",\"Delete\":\"删除\",\"Deleted\":\"已删除\",\"Remove\":\"移除\",\"Clear\":\"清除\",\"Clear All\":\"全部清除\",\"Reset\":\"重置\",\"Restore\":\"恢复\",\"Default\":\"默认\",\"Done\":\"完成\",\"Finish\":\"完成\",\"Next\":\"下一步\",\"Previous\":\"上一步\",\"Submit\":\"提交\",\"OK\":\"确定\",\"Yes\":\"是\",\"True\":\"是\",\"False\":\"否\",\"All\":\"全部\",\"None\":\"无\",\"Select\":\"选择\",\"Selected\":\"已选择\",\"Deselect All\":\"取消全选\",\"Create\":\"创建\",\"New\":\"新建\",\"Search\":\"搜索\",\"Find\":\"查找\",\"Filter\":\"筛选\",\"Filter...\":\"筛选...\",\"Sort\":\"排序\",\"Sort by\":\"排序方式\",\"Name\":\"名称\",\"Date\":\"日期\",\"Date Modified\":\"修改日期\",\"Size\":\"大小\",\"Type\":\"类型\",\"Action\":\"操作\",\"Actions\":\"操作列表\",\"Options\":\"选项\",\"More\":\"更多\",\"More Options\":\"更多选项\",\"Properties\":\"属性\",\"Information\":\"信息\",\"Learn More\":\"了解更多\",\"Learn more\":\"了解更多\",\"View All\":\"查看全部\",\"Open\":\"打开\",\"Open in Editor\":\"在编辑器中打开\",\"Open Folder\":\"打开文件夹\",\"Copy Link\":\"复制链接\",\"Paste Here\":\"粘贴到此处\",\"Rename\":\"重命名\",\"Duplicate\":\"创建副本\",\"Import\":\"导入\",\"Download\":\"下载\",\"Upload\":\"上传\",\"Connect\":\"连接\",\"Reconnect\":\"重新连接\",\"Connecting...\":\"正在连接...\",\"Loading...\":\"正在加载...\",\"Loading\":\"正在加载\",\"Please wait...\":\"请稍候...\",\"Successful\":\"成功\",\"Active\":\"已激活\",\"Inactive\":\"未激活\",\"Unknown\":\"未知\",\"Optional\":\"可选\",\"Required\":\"必填\",\"Support\":\"技术支持\",\"Changelog\":\"更新日志\",\"Release Notes\":\"版本说明\",\"License\":\"许可证\",\"Privacy Policy\":\"隐私政策\",\"Terms of Service\":\"服务条款\",\"Volume\":\"音量\",\"Email\":\"邮箱\",\"Links\":\"链接\",\"Logs\":\"日志\",\"Other\":\"其他\",\"Local\":\"本地\",\"Reads\":\"读取记录\",\"Read URLs\":\"读取网址\",\"Invalid Media\":\"无效媒体\",\"Google Drive\":\"Google 云端硬盘\",\"Google Chat\":\"Google Chat\",\"Drive\":\"云端硬盘\",\"here\":\"此处\",\"When\":\"当\",\"After\":\"之后\",\"Show\":\"显示\",\"Hide\":\"隐藏\",\"Root\":\"根目录\",\"Layer\":\"图层\",\"Go to\":\"前往\",\"Add to Workspace\":\"添加到工作区\",\"Remove from Workspace\":\"从工作区中移除\",\"Current Workspace\":\"当前工作区\",\"Workspace Settings\":\"工作区设置\",\"Workspace Root\":\"工作区根目录\",\"Workspace Folder\":\"工作区文件夹\",\"Workspace Rules\":\"工作区规则\",\"Select a workspace\":\"选择工作区\",\"Switch Workspace\":\"切换工作区\",\"Reload Workspace\":\"重新加载工作区\",\"Open Recent\":\"打开最近的项目\",\"Clear Recent\":\"清除最近记录\",\"Toggle Word Wrap\":\"切换自动换行\",\"Find in Files\":\"在文件中查找\",\"Replace in Files\":\"在文件中替换\",\"Match Case\":\"区分大小写\",\"Match Whole Word\":\"全字匹配\",\"Use Regular Expression\":\"使用正则表达式\",\"Collapse Folders in Explorer\":\"在资源管理器中折叠文件夹\",\"New Terminal at Workspace\":\"在工作区新建终端\",\"Run Task\":\"运行任务\",\"Restart Task\":\"重新启动任务\",\"Terminate Task\":\"终止任务\",\"Show Task Output\":\"显示任务输出\",\"Manage Extensions\":\"管理扩展\",\"Install Extension\":\"安装扩展\",\"Disable Extension\":\"禁用扩展\",\"Enable Extension\":\"启用扩展\",\"Extension Settings\":\"扩展设置\",\"Auto Save\":\"自动保存\",\"Format Document\":\"格式化文档\",\"Format Selection\":\"格式化选中文本\",\"Go to Definition\":\"跳转到定义\",\"Go to References\":\"跳转到引用\",\"Peek Definition\":\"速览定义\",\"Rename Symbol\":\"重命名符号\",\"Command Palette\":\"命令面板\",\"Quick Open\":\"快速打开\",\"Show All Commands\":\"显示所有命令\",\"Show Shortcuts\":\"显示快捷键\",\"Open User Settings\":\"打开用户设置\",\"Open Workspace Settings\":\"打开工作区设置\",\"Check for Extension Updates\":\"检查扩展更新\",\"Install from VSIX...\":\"从 VSIX 安装...\",\"Developer: Toggle Developer Tools\":\"开发者：切换开发者工具\",\"Developer: Reload Window\":\"开发者：重新加载窗口\",\"User Guide\":\"用户指南\",\"Report Issue\":\"报告问题\",\"View License\":\"查看许可证\",\"Privacy Statement\":\"隐私声明\",\"Trust Workspace\":\"信任工作区\",\"Manage Workspace Trust\":\"管理工作区信任\",\"Security Warning\":\"安全警告\",\"Are you sure?\":\"确定要继续吗？\",\"Are you sure you want to delete this?\":\"确定要删除此项吗？\",\"This action cannot be undone.\":\"此操作无法撤消。\",\"Discard all changes\":\"放弃所有更改\",\"Apply all changes\":\"应用所有更改\",\"Keep waiting\":\"继续等待\",\"Process finished with exit code\":\"进程已结束，退出代码：\",\"Failed to start process\":\"启动进程失败\",\"Connection lost\":\"连接已断开\",\"Reconnecting in\":\"重新连接倒计时：\",\"Connected to server\":\"已连接到服务器\",\"Disconnected from server\":\"已从服务器断开\",\"Network request failed\":\"网络请求失败\",\"Request timed out\":\"请求超时\",\"Unauthorized\":\"未授权\",\"Forbidden\":\"无权限访问\",\"Not Found\":\"未找到\",\"Internal Server Error\":\"服务器内部错误\",\"Bad Request\":\"错误请求\",\"Service Unavailable\":\"服务不可用\",\"Rate limit exceeded\":\"请求频率超出限制\",\"Too many requests\":\"请求过多\",\"Please try again later\":\"请稍后重试\",\"Copied to clipboard\":\"已复制到剪贴板\",\"Copy to clipboard\":\"复制到剪贴板\",\"Failed to copy to clipboard\":\"复制到剪贴板失败\",\"No changes detected\":\"未检测到更改\",\"All changes saved\":\"所有更改均已保存\",\"Unsaved changes\":\"未保存的更改\",\"Do you want to save the changes?\":\"是否要保存更改？\",\"Don't Save\":\"不保存\",\"Save and Close\":\"保存并关闭\",\"Discard and Close\":\"放弃并关闭\",\"Always for this workspace\":\"始终对此工作区生效\",\"Always for this command\":\"始终允许此命令\",\"Never ask again\":\"不再询问\",\"Remember my choice\":\"记住我的选择\",\"Ask every time\":\"每次都询问\",\"Always allow\":\"始终允许\",\"Always deny\":\"始终拒绝\",\"Prompt each time\":\"每次提示\",\"Model thinking\":\"模型正在思考\",\"Generate response\":\"生成回复\",\"Stop generating\":\"停止生成\",\"Response stopped\":\"回复已停止\",\"Generation complete\":\"生成完毕\",\"Tokens per second\":\"每秒 Token 数\",\"Total tokens\":\"Token 总数\",\"Prompt tokens\":\"提示词 Token 数\",\"Completion tokens\":\"补全 Token 数\",\"Cost\":\"费用\",\"Estimated cost\":\"预估费用\",\"Free tier\":\"免费层级\",\"Pro tier\":\"专业版层级\",\"Upgrade plan\":\"升级方案\",\"Manage subscription\":\"管理订阅\",\"Billing\":\"账单\",\"Payment method\":\"支付方式\",\"Usage limits\":\"使用限额\",\"Monthly spend\":\"本月消费\",\"Current balance\":\"当前余额\",\"Add funds\":\"充值\",\"Auto-refill\":\"自动续费\",\"Invoice history\":\"发票历史\",\"Download invoice\":\"下载发票\",\"Receipt\":\"收据\",\"Transaction history\":\"交易记录\",\"Enterprise\":\"企业版\",\"Organization\":\"组织\",\"Team members\":\"团队成员\",\"Invite members\":\"邀请成员\",\"Role\":\"角色\",\"Admin\":\"管理员\",\"Member\":\"成员\",\"Viewer\":\"只读访客\",\"Change role\":\"更改角色\",\"Remove member\":\"移除成员\",\"Transfer ownership\":\"转让所有权\",\"Leave organization\":\"离开组织\",\"Delete organization\":\"删除组织\",\"Audit log\":\"审计日志\",\"Single Sign-On\":\"单点登录 (SSO)\",\"Two-Factor Authentication\":\"双重验证 (2FA)\",\"API Keys\":\"API 密钥\",\"Create new API key\":\"创建新 API 密钥\",\"Revoke key\":\"撤销密钥\",\"Key name\":\"密钥名称\",\"Last used\":\"上次使用\",\"Never used\":\"从未使用\",\"Secret key\":\"私钥\",\"Copy Secret Key\":\"复制私钥\",\"Store this key securely. It will not be shown again.\":\"请妥善保管此密钥，它将不再显示。\",\"Webhook\":\"Webhook 回调\",\"Webhooks\":\"Webhooks 列表\",\"Create webhook\":\"创建 Webhook\",\"Test delivery\":\"测试发送\",\"Delivery history\":\"发送记录\",\"Payload URL\":\"有效载荷 URL\",\"Secret token\":\"安全令牌\",\"Event triggers\":\"事件触发器\",\"SSL verification\":\"SSL 验证\",\"Active webhook\":\"启用 Webhook\",\"Inactive webhook\":\"禁用 Webhook\",\"Delete webhook\":\"删除 Webhook\",\"Edit webhook\":\"编辑 Webhook\",\"Save webhook\":\"保存 Webhook\",\"Custom headers\":\"自定义请求头\",\"Response status\":\"响应状态\",\"Response body\":\"响应体\",\"Request body\":\"请求体\",\"Duration\":\"耗时\",\"Triggered at\":\"触发于\",\"Retry delivery\":\"重试发送\",\"Agent memory\":\"智能体记忆\",\"Clear agent memory\":\"清除智能体记忆\",\"Context length\":\"上下文长度\",\"Max output tokens\":\"最大输出 Token\",\"Temperature\":\"采样温度\",\"Top P\":\"Top P 采样\",\"Top K\":\"Top K 采样\",\"Frequency penalty\":\"频率惩罚\",\"Presence penalty\":\"存在惩罚\",\"System instructions\":\"系统提示词\",\"Custom system prompt\":\"自定义系统提示词\",\"Default instructions\":\"默认提示词\",\"Reset to default prompt\":\"恢复为默认提示词\",\"Prompt template\":\"提示词模板\",\"Variables\":\"变量\",\"Insert variable\":\"插入变量\",\"Save prompt\":\"保存提示词\",\"Load prompt\":\"加载提示词\",\"Delete prompt\":\"删除提示词\",\"Public prompt\":\"公开提示词\",\"Private prompt\":\"私有提示词\",\"Import prompts\":\"导入提示词\",\"Export prompts\":\"导出提示词\",\"Prompt library\":\"提示词库\",\"Favorite prompts\":\"收藏的提示词\",\"Community prompts\":\"社区提示词\",\"Featured prompts\":\"精选提示词\",\"Search prompts...\":\"搜索提示词...\",\"Filter by tag\":\"按标签筛选\",\"Add tag\":\"添加标签\",\"Remove tag\":\"移除标签\",\"Tags\":\"标签列表\",\"Categories\":\"分类列表\",\"Select category\":\"选择分类\",\"Create new category\":\"创建新分类\",\"Rename category\":\"重命名分类\",\"Delete category\":\"删除分类\",\"Move to category\":\"移动到分类\",\"No category\":\"未分类\",\"General category\":\"常规分类\",\"Coding category\":\"编程分类\",\"Writing category\":\"写作分类\",\"Analysis category\":\"分析分类\",\"Roleplay category\":\"角色扮演分类\",\"Other category\":\"其他分类\",\"Chief of Staff canvas\":\"幕僚长画布\",\"Mark Unread\":\"标为未读\",\"Mark Read\":\"标为已读\",\"Split\":\"拆分\",\"Archive\":\"归档\",\"Unarchive\":\"取消归档\",\"Delete Permanently\":\"永久删除\",\"Move to Group\":\"移动到分组\",\"Conversation Name\":\"对话名称\",\"Conversation ID\":\"对话 ID\",\"Workspace Name\":\"工作区名称\",\"Worktree Name\":\"Worktree 名称\",\"Project Name\":\"项目名称\",\"Replace with New\":\"替换为新对话\",\"Remove from Split\":\"从拆分中移除\",\"View Debug\":\"查看调试信息\",\"Conversation Telemetry\":\"对话遥测\",\"Telemetry is off for all conversations.\":\"所有对话的遥测已关闭。\",\"Telemetry is off for this conversation.\":\"当前对话的遥测已关闭。\",\"Telemetry is turned off in settings\":\"设置中已关闭遥测\",\"Telemetry will be enabled for this conversation; click to disable.\":\"当前对话将启用遥测；点击以禁用。\",\"Telemetry will be disabled for this conversation; click to enable.\":\"当前对话将禁用遥测；点击以启用。\",\"Enable telemetry in Settings before changing per-conversation telemetry.\":\"在更改单个对话的遥测设置之前，请先在设置中启用遥测。\",\"Action requires your attention\":\"有操作需要您确认\",\"The agent is waiting for your input.\":\"智能体正在等待您的输入。\",\"The agent has questions for you:\":\"智能体有几个问题需要您回答：\",\"The agent has a question for you:\":\"智能体有一个问题需要您回答：\",\"Click to respond to the questions.\":\"点击以回答这些问题。\",\"Click to respond to the question.\":\"点击以回答该问题。\",\"Confirmation required to execute this step\":\"执行此步骤需要确认\",\"Confirm Browser Interaction\":\"确认浏览器交互\",\"Open Browser Setup\":\"打开浏览器设置\",\"Setup\":\"设置\",\"Configure\":\"配置\",\"Try Again\":\"重试\",\"Confirm & Save\":\"确认并保存\",\"Confirm Selection\":\"确认选择\",\"Confirm Undo\":\"确认撤消\",\"Confirming this undo action will make the following changes:\":\"确认此撤消操作将执行以下更改：\",\"Proceed Anyway\":\"仍然继续\",\"Proceed in Sandbox\":\"在沙盒中继续\",\"Proceed with Plan\":\"按照计划继续执行\",\"Proceed with implementation plan\":\"按照实施计划继续执行\",\"Proceeded with\":\"已继续执行\",\"Accept\":\"接受\",\"Yes, allow\":\"是，允许\",\"Yes, allow this download\":\"是，允许此下载\",\"Yes, allow this time\":\"是，仅允许本次\",\"Failed to proceed\":\"继续执行失败\",\"Turbo\":\"极速模式 (Turbo)\",\"Open allowlist\":\"打开白名单\",\"Add to allowlist\":\"添加到白名单\",\"Added to allowlist\":\"已添加到白名单\",\"Add them to allow future interactions\":\"添加它们以允许后续交互\",\"The Agent attempted to interact with some sites that are not allowlisted\":\"智能体尝试与某些未加入白名单的网站交互\",\"These MCP allowlist rules are enforced by your organization's administrator.\":\"这些 MCP 白名单规则由您组织的管理员强制执行。\",\"Require Review\":\"需要审阅\",\"More options\":\"更多选项\",\"Requesting your permission in Terminal:\":\"正在终端中请求您的权限：\",\"Requesting your permission to open URL:\":\"正在请求打开网址的权限：\",\"Requesting your permission:\":\"正在请求您的权限：\",\"Waiting for your approval\":\"等待您的批准\",\"Needs your approval\":\"需要您的批准\",\"Failed to resolve permissions. Please try again.\":\"解析权限失败。请重试。\",\"Failed to update permissions. Please try again.\":\"更新权限失败。请重试。\",\"Resolving permissions...\":\"正在解析权限...\",\"Review permissions\":\"审阅权限\",\"Review Permissions\":\"审阅权限\",\"Next: Review Permissions\":\"下一步：审阅权限\",\"Permission denied\":\"权限被拒绝\",\"Terminal & Tooling Permissions\":\"终端与工具权限\",\"Cloud Permissions\":\"云端权限\",\"Remote Permissions\":\"远程权限\",\"Allowed Domains\":\"允许的域名\",\"Site Allowlist\":\"网站白名单\",\"Prompt for approval before running browser scripts.\":\"在运行浏览器脚本前提示审批。\",\"Allow full browser script execution without prompting.\":\"允许完整的浏览器脚本执行而无需提示。\",\"Allow creating issues and grant access to specific issues.\":\"允许创建 Issue 并授予访问特定 Issue 的权限。\",\"Allow opening pull requests and grant access to specific PRs.\":\"允许打开 Pull Request 并授予访问特定 PR 的权限。\",\"Allow remote debugging for this browser instance\":\"允许此浏览器实例的远程调试\",\"Allow the browser agent to download a file?\":\"允许浏览器智能体下载文件吗？\",\"Controls whether terminal commands require your approval before running.\":\"控制终端命令在运行前是否需要您的批准。\",\"This extension has no declared permissions requiring user input.\":\"此扩展没有需要用户输入的已声明权限。\",\"Submit Prompt (Alternate to Enter)\":\"发送提示词（Enter 的备用快捷键）\",\"Enter always submits. This adds a second shortcut.\":\"Enter 键始终用于发送。此项用于添加第二个快捷键。\",\"Jump to Previous Prompt\":\"跳转到上一条提示词\",\"Jump to Next Prompt\":\"跳转到下一条提示词\",\"Side Question Selection\":\"辅助提问选择\",\"Pin / Unpin Conversation\":\"置顶 / 取消置顶对话\",\"Orchestrator Settings\":\"编排器设置\",\"Choose the models Orchestrator uses. A larger, smarter orchestrator model with a faster, cheaper executor gives high quality for fewer tokens.\":\"选择编排器使用的模型。使用更大、更智能的编排模型搭配更快、更经济的执行模型，可在消耗更少 Token 的情况下获得高质量结果。\",\"Orchestrator Model\":\"编排模型\",\"Plans the work, makes design decisions, and reviews the result. Pick a top-tier model. You can also pick one per conversation from the Orchestrator row in the model menu.\":\"负责规划工作、做出设计决策并审查结果。请选择顶级模型。您也可以在模型菜单的“编排器”行中为每个对话单独选择。\",\"Executor Model\":\"执行模型\",\"Carries out the plan: searches, edits, builds, and tests. Pick a faster, cheaper model.\":\"负责执行计划：搜索、编辑、构建和测试。请选择更快、更经济的模型。\",\"Orchestrator\":\"编排器\",\"Executor\":\"执行器\",\"Weekly Limit\":\"每周限额\",\"5-hour Limit\":\"5 小时限额\",\"Five Hour Limit\":\"5 小时限额\",\"Daily Limit\":\"每日限额\",\"This computer\":\"本地计算机\",\"Default and Auto need the terminal sandbox, which isn't available on this host.\":\"“默认”和“自动”模式需要终端沙箱，但当前主机不支持该功能。\",\"Tool permissions\":\"工具权限\",\"Network access rules\":\"网络访问规则\",\"Input Box\":\"输入框\",\"Input box\":\"输入框\",\"Queued messages\":\"排队消息\",\"Choose which key sends a message in the chat composer.\":\"选择在对话输入框中用于发送消息的按键。\",\"Permission preset\":\"权限预设\",\"Enable notifications for agent\":\"启用智能体通知\",\"Enable sounds for agent\":\"启用智能体声音提示\",\"Your plan\":\"当前方案\",\"Your plan:\":\"当前方案：\",\"Your plan: Google AI Pro\":\"当前方案：Google AI Pro\",\"Your plan: Google AI Ultra\":\"当前方案：Google AI Ultra\",\"Your plan: Free\":\"当前方案：免费版\",\"Enable AI credit overages\":\"允许使用超额 AI 额度\",\"Conversation steps\":\"对话步骤\",\"Notification settings\":\"通知设置\",\"Open links in\":\"链接打开方式\",\"Download location\":\"下载位置\",\"Browsing history\":\"浏览历史\",\"Browser actuation rules\":\"浏览器操作规则\"};\n\n  // 针对多词词条建立小写回退索引，自动兼容 Title Case 与 Sentence case\n  const LOWER_DICTIONARY = Object.create(null);\n  for (const k in DICTIONARY) {\n    if (k.indexOf(' ') !== -1 && DICTIONARY[k] !== k) {\n      const lk = k.toLowerCase();\n      if (!(lk in LOWER_DICTIONARY)) {\n        LOWER_DICTIONARY[lk] = DICTIONARY[k];\n      }\n    }\n  }\n\n  function lookupDictionary(text) {\n    if (!text) return undefined;\n    const exact = DICTIONARY[text];\n    if (exact) return exact;\n    if (text.indexOf(' ') !== -1 && /^[A-Z]/.test(text)) {\n      return LOWER_DICTIONARY[text.toLowerCase()];\n    }\n    return undefined;\n  }\n\n  function translatePhrase(text) {\n    let zh = lookupDictionary(text);\n    if (!zh) {\n      for (let i = 0; i < REGEX_RULES.length; i++) {\n        const rule = REGEX_RULES[i];\n        const m = rule.pattern.exec(text);\n        if (m) {\n          if (typeof rule.formatter === 'function') {\n            zh = rule.formatter(m);\n          } else if (rule.replace) {\n            zh = text.replace(rule.pattern, rule.replace);\n          }\n          break;\n        }\n      }\n    }\n    return zh;\n  }\n\n  function formatDurationZh(str) {\n    if (!str) return '';\n    return str\n      .replace(/(\\d+)\\s+days?/gi, '$1 天')\n      .replace(/(\\d+)\\s+hours?/gi, '$1 小时')\n      .replace(/(\\d+)\\s+minutes?/gi, '$1 分钟')\n      .replace(/(\\d+)\\s+seconds?/gi, '$1 秒')\n      .replace(/,\\s*/g, ' ')\n      .trim();\n  }\n\n  const REGEX_RULES = [\n    { pattern: /^Your plan:\\s*(.+)$/i, replace: '当前方案：$1' },\n    { pattern: /^(.+?)\\s+Weekly Limit$/i, replace: '$1 每周限额' },\n    { pattern: /^(.+?)\\s+Weekly Limit Remaining$/i, replace: '$1 每周剩余额度' },\n    { pattern: /^(.+?)\\s+5-hour Limit$/i, replace: '$1 5 小时限额' },\n    { pattern: /^(.+?)\\s+Five Hour Limit$/i, replace: '$1 5 小时限额' },\n    { pattern: /^(.+?)\\s+Daily Limit$/i, replace: '$1 每日限额' },\n    { pattern: /^Agent needs permission to act on\\s+(.*?)$/i, replace: '智能体需要获得对 $1 执行操作的权限' },\n    { pattern: /^Command:\\s*(.*?)$/i, replace: '命令：$1' },\n    { pattern: /^URL:\\s*(.*?)$/i, replace: '网址：$1' },\n    { pattern: /^Move to Group:\\s*(.*?)$/i, replace: '移动到分组：$1' },\n    { pattern: /^Failed to add URL to allowlist:\\s*(.*?)$/i, replace: '添加网址到白名单失败：$1' },\n    // 插件市场动态文案\n    { pattern: /^Search for \"(.*?)\" in the Marketplace$/i, replace: '在插件市场中搜索“$1”' },\n    { pattern: /^No plugins found for \"(.*?)\"\\.?$/i, replace: '未找到与“$1”匹配的插件。' },\n    { pattern: /^See more in (.*?)$/i, replace: '查看 $1 中的更多内容' },\n    { pattern: /^See less in (.*?)$/i, replace: '收起 $1 中的内容' },\n    { pattern: /^Add all \\u00b7 (\\d+)$/i, replace: '全部添加 · $1' },\n    { pattern: /^Add (\\d+) (?:plugin|plugins) from (.*?)$/i, replace: '添加来自 $2 的 $1 个插件' },\n    { pattern: /^Adding plugins from (.*?)$/i, replace: '正在添加来自 $1 的插件' },\n    { pattern: /^Adding (.*?)$/i, replace: '正在添加 $1' },\n    { pattern: /^Details for (.*?)$/i, replace: '$1 详情' },\n    { pattern: /^(\\d+) MCP (?:servers?|server) failed to start$/i, replace: '$1 个 MCP 服务器启动失败' },\n    // 配额与时间动态模板\n    {\n      pattern: /^You have used some of your weekly limit, it will fully refresh in (.+?)\\.?$/i,\n      formatter: (m) => '您已消耗部分每周额度，将在 ' + formatDurationZh(m[1]) + ' 后完全重置。'\n    },\n    {\n      pattern: /^You have used some of your 5-hour limit, it will fully refresh in (.+?)\\.?$/i,\n      formatter: (m) => '您已消耗部分 5 小时额度，将在 ' + formatDurationZh(m[1]) + ' 后完全重置。'\n    },\n    {\n      pattern: /^You have used some of your (.+?) limit, it will fully refresh in (.+?)\\.?$/i,\n      formatter: (m) => '您已消耗部分 ' + m[1] + ' 额度，将在 ' + formatDurationZh(m[2]) + ' 后完全重置。'\n    },\n    {\n      pattern: /^You have reached your weekly limit, it will fully refresh in (.+?)\\.?$/i,\n      formatter: (m) => '您已达到每周额度上限，将在 ' + formatDurationZh(m[1]) + ' 后完全重置。'\n    },\n    {\n      pattern: /^You have reached your 5-hour limit, it will fully refresh in (.+?)\\.?$/i,\n      formatter: (m) => '您已达到 5 小时额度上限，将在 ' + formatDurationZh(m[1]) + ' 后完全重置。'\n    },\n    {\n      pattern: /^You have reached your (.+?) limit, it will fully refresh in (.+?)\\.?$/i,\n      formatter: (m) => '您已达到 ' + m[1] + ' 额度上限，将在 ' + formatDurationZh(m[2]) + ' 后完全重置。'\n    },\n    {\n      pattern: /^it will fully refresh in (.+?)\\.?$/i,\n      formatter: (m) => '将在 ' + formatDurationZh(m[1]) + ' 后完全重置。'\n    },\n    { pattern: /^Resets in\\s+(\\d+)d\\s+(\\d+)h$/i, replace: '将在 $1 天 $2 小时后重置' },\n    { pattern: /^Resets in\\s+(\\d+)h\\s+(\\d+)m$/i, replace: '将在 $1 小时 $2 分钟后重置' },\n    { pattern: /^Resets in\\s+(\\d+)d$/i, replace: '将在 $1 天后重置' },\n    { pattern: /^Resets in\\s+(\\d+)h$/i, replace: '将在 $1 小时后重置' },\n    { pattern: /^Resets in\\s+(\\d+)m$/i, replace: '将在 $1 分钟后重置' },\n    { pattern: /^Resets in\\s+<1m$/i, replace: '将在 1 分钟内重置' },\n    { pattern: /^Available AI Credits:\\s*(.+)$/i, replace: '可用 AI 额度：$1' },\n    { pattern: /^(\\d+)\\s+Hour Limit Remaining$/i, replace: '$1 小时剩余额度' },\n    { pattern: /^(\\d+)\\s+Day Limit Remaining$/i, replace: '$1 天剩余额度' },\n\n    // 空状态复合模板处理 (No ... yet)\n    { pattern: /^No\\s+automations\\s+yet$/i, replace: '暂无自动化任务' },\n    { pattern: /^No\\s+tasks\\s+yet$/i, replace: '暂无任务' },\n    { pattern: /^No\\s+conversations\\s+yet$/i, replace: '暂无对话' },\n    { pattern: /^No\\s+artifacts\\s+yet$/i, replace: '暂无产物' },\n    { pattern: /^No\\s+rules?\\s+yet$/i, replace: '暂无规则' },\n    { pattern: /^No\\s+skills?\\s+yet$/i, replace: '暂无技能' },\n    { pattern: /^No\\s+plugins?\\s+yet$/i, replace: '暂无插件' },\n    { pattern: /^No\\s+(\\w+)\\s+yet$/i, replace: '暂无 $1' },\n\n    // 文件与通用模板\n    { pattern: /^(\\d+)\\s+files?\\s+changed$/i, replace: '$1 个文件已修改' },\n    { pattern: /^(\\d+)\\s+insertions?\\(\\+\\)$/i, replace: '$1 处添加(+)' },\n    { pattern: /^(\\d+)\\s+deletions?\\(-\\)$/i, replace: '$1 处删除(-)' },\n    { pattern: /^(\\d+)\\s+seconds?\\s+ago$/i, replace: '$1 秒前' },\n    { pattern: /^(\\d+)\\s+minutes?\\s+ago$/i, replace: '$1 分钟前' },\n    { pattern: /^(\\d+)\\s+hours?\\s+ago$/i, replace: '$1 小时前' },\n    { pattern: /^(\\d+)\\s+days?\\s+ago$/i, replace: '$1 天前' },\n    { pattern: /^(\\d+)\\s+agents?\\s+running$/i, replace: '$1 个智能体运行中' },\n    { pattern: /^Thought for\\s+(\\d+(?:\\.\\d+)?)\\s*s$/i, replace: '思考用时 $1 秒' },\n    { pattern: /^Thought for\\s+(\\d+(?:\\.\\d+)?)\\s*seconds$/i, replace: '思考用时 $1 秒' },\n    { pattern: /^(\\d+)\\s+of\\s+(\\d+)\\s+tasks?\\s+completed$/i, replace: '已完成 $1 / $2 个任务' },\n    { pattern: /^Showing\\s+(\\d+)\\s+of\\s+(\\d+)\\s+results$/i, replace: '显示 $1 / $2 项结果' },\n    { pattern: /^Selected\\s+(\\d+)\\s+items?$/i, replace: '已选择 $1 项' },\n    { pattern: /^Step\\s+(\\d+)\\s+of\\s+(\\d+)$/i, replace: '步骤 $1 / $2' }\n  ];\n\n  // 2. 状态映射（记录最后一次赋的值，防止死循环并支持对抗 React 重渲染）\n  const lastAssignedText = new WeakMap();\n\n  function shouldSkip(el) {\n    try {\n      if (!el || el.nodeType !== 1) return false;\n      const tag = el.tagName;\n      if (tag === 'PRE' || tag === 'CODE' || tag === 'KBD' || tag === 'SAMP' ||\n          tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA') {\n        return true;\n      }\n      if (el.isContentEditable) return true;\n      if (typeof el.closest === 'function') {\n        if (el.closest('pre, code, [contenteditable=\"true\"], .monaco-editor, .cm-editor, .xterm, .terminal-pane')) {\n          return true;\n        }\n      }\n    } catch (e) {}\n    return false;\n  }\n\n    // 检查复合父容器（处理由多个 TextNode 拼接成的 No ... yet 以及计划提示）\n  function translateCompoundElement(el) {\n    try {\n      if (!el || el.nodeType !== 1) return false;\n\n      // 1. 处理计划命令提示条: Type / and select plan to have the agent generate a plan.\n      const planAlert = typeof el.closest === 'function' ? el.closest('[data-testid=\"plan-command-fyi-alert\"]') : null;\n      if (planAlert) {\n        const walker = document.createTreeWalker(planAlert, NodeFilter.SHOW_TEXT, null, false);\n        let n;\n        while (n = walker.nextNode()) {\n          const val = n.nodeValue ? n.nodeValue.trim() : '';\n          if (val === 'Type' || val === '类型') {\n            n.nodeValue = '输入 ';\n            lastAssignedText.set(n, n.nodeValue);\n          } else if (val === 'and select') {\n            n.nodeValue = ' 并选择 ';\n            lastAssignedText.set(n, n.nodeValue);\n          } else if (val === 'to have the agent generate a plan.') {\n            n.nodeValue = ' 让智能体生成计划。';\n            lastAssignedText.set(n, n.nodeValue);\n          }\n        }\n        return true;\n      }\n\n      // 2. 处理 No ... yet 复合结构\n      if (el.children.length === 0 && el.childNodes.length > 1) {\n        const fullText = el.textContent?.trim();\n        if (fullText && /^No\\s+[\\w\\s]+\\s+yet$/i.test(fullText)) {\n          const zh = translatePhrase(fullText);\n          if (zh && zh !== fullText) {\n            el.textContent = zh;\n            return true;\n          }\n        }\n      }\n    } catch (e) {}\n    return false;\n  }\n\n  function translateTextNode(node) {\n    try {\n      if (!node || node.nodeType !== 3) return;\n      const parent = node.parentElement;\n      if (parent && shouldSkip(parent)) return;\n\n      const raw = node.nodeValue;\n      if (!raw) return;\n      if (lastAssignedText.get(node) === raw) return;\n\n      const trimmed = raw.trim();\n      if (!trimmed) return;\n\n      // 如果当前父元素可以整体作为复合短语汉化，则优先整体汉化\n      if (parent && translateCompoundElement(parent)) {\n        return;\n      }\n\n      const zh = translatePhrase(trimmed);\n\n      if (zh && zh !== trimmed) {\n        const leading = raw.match(/^\\s*/)[0];\n        const trailing = raw.match(/\\s*$/)[0];\n        const finalZh = leading + zh + trailing;\n        lastAssignedText.set(node, finalZh);\n        node.nodeValue = finalZh;\n      }\n    } catch (e) {}\n  }\n\n    function translateAttributes(el) {\n    try {\n      if (!el || el.nodeType !== 1) return;\n      const attrs = ['placeholder', 'data-placeholder', 'title', 'aria-label'];\n      for (let i = 0; i < attrs.length; i++) {\n        const attr = attrs[i];\n        const val = el.getAttribute(attr);\n        if (!val) continue;\n        if (el.dataset && el.dataset['__zh_' + attr] === val) continue;\n\n        const trimmed = val.trim();\n        const zh = translatePhrase(trimmed);\n        if (zh && zh !== val) {\n          if (el.dataset) el.dataset['__zh_' + attr] = zh;\n          el.setAttribute(attr, zh);\n          if (attr in el) {\n            try { el[attr] = zh; } catch (e) {}\n          }\n        }\n      }\n    } catch (e) {}\n  }\n\n  function translateSubtree(root) {\n    try {\n      if (!root) return;\n      if (root.nodeType === 3) {\n        translateTextNode(root);\n        return;\n      }\n      if (root.nodeType === 1) {\n        if (shouldSkip(root)) return;\n        if (translateCompoundElement(root)) return;\n        translateAttributes(root);\n\n        if (root.shadowRoot) {\n          observeRoot(root.shadowRoot);\n          translateSubtree(root.shadowRoot);\n        }\n\n        if (root.tagName === 'IFRAME') {\n          try {\n            const doc = root.contentDocument;\n            if (doc) {\n              observeRoot(doc);\n              translateSubtree(doc.body || doc.documentElement);\n            }\n          } catch (err) {}\n        }\n      }\n\n      const children = root.childNodes;\n      if (children) {\n        for (let i = 0; i < children.length; i++) {\n          translateSubtree(children[i]);\n        }\n      }\n    } catch (e) {}\n  }\n\n  const observedRoots = new WeakSet();\n  function observeRoot(root) {\n    try {\n      if (!root || observedRoots.has(root)) return;\n      observedRoots.add(root);\n\n      const observer = new MutationObserver((mutations) => {\n        try {\n          for (let i = 0; i < mutations.length; i++) {\n            const mut = mutations[i];\n            if (mut.type === 'characterData') {\n              translateTextNode(mut.target);\n            } else if (mut.type === 'childList') {\n              const added = mut.addedNodes;\n              for (let j = 0; j < added.length; j++) {\n                const n = added[j];\n                if (n.nodeType === 3) {\n                  translateTextNode(n);\n                } else if (n.nodeType === 1) {\n                  translateSubtree(n);\n                }\n              }\n            } else if (mut.type === 'attributes') {\n              translateAttributes(mut.target);\n            }\n          }\n        } catch (err) {}\n      });\n\n      observer.observe(root, {\n        childList: true,\n        subtree: true,\n        characterData: true,\n        attributes: true,\n        attributeFilter: ['placeholder', 'data-placeholder', 'title', 'aria-label']\n      });\n    } catch (e) {}\n  }\n\n  // 3. 挂钩 Element.prototype.attachShadow\n  try {\n    const origAttach = Element.prototype.attachShadow;\n    Element.prototype.attachShadow = function(init) {\n      const shadow = origAttach.apply(this, arguments);\n      try {\n        observeRoot(shadow);\n        translateSubtree(shadow);\n      } catch (e) {}\n      return shadow;\n    };\n  } catch (e) {}\n\n  // 4. 监听与初始扫描\n  function runScan() {\n    try {\n      observeRoot(document);\n      translateSubtree(document.body || document.documentElement);\n    } catch (e) {}\n  }\n\n  if (document.documentElement) {\n    observeRoot(document.documentElement);\n  }\n  if (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', runScan, { once: true });\n  } else {\n    runScan();\n  }\n\n  // 定时巡检几轮，确保 React 异步渲染完成后全部汉化\n  [200, 500, 1000, 2000, 4000].forEach(delay => {\n    setTimeout(runScan, delay);\n  });\n})();";
/* [OVERLAY_CODE_END] */

const I18N_ZH_CONTENT = OVERLAY_CODE + '\ntry { module.exports = { DICTIONARY, REGEX_RULES }; } catch(e){}\n';
const EXPECTED_HASH = crypto.createHash('sha256').update(I18N_ZH_CONTENT, 'utf8').digest('hex');

if (!fs.existsSync(ASAR_PATH)) {
  console.error('[错误] 未找到 app.asar: ' + ASAR_PATH);
  process.exit(1);
}

if (ifNeeded) {
  const entry = inspectAsarEntry(ASAR_PATH, ['dist', 'i18nZh.js']);
  if (entry && entry.sha256 === EXPECTED_HASH) {
    log('✓ 检测到当前 app.asar 已是最新汉化版本，跳过重复注入。');
    launchAntigravityApp();
    process.exit(0);
  }
}

log('=== Antigravity 简体中文汉化补丁安装程序 (严格幂等版) ===');
log('安装目录:', INSTALL_DIR);

killAntigravityIfRunning();

// 1. 备份原版 app.asar（首次备份，或检测到官方更新未汉化版本时自动刷新备份）
const existingEntry = inspectAsarEntry(ASAR_PATH, ['dist', 'i18nZh.js']);
const alreadyPatched = Boolean(existingEntry);

if (!fs.existsSync(ORIG_PATH)) {
  log('[1/6] 正在备份原版 app.asar 到 app.asar.orig ...');
  fs.copyFileSync(ASAR_PATH, ORIG_PATH);
  log('      备份完成: ' + ORIG_PATH);
} else if (!alreadyPatched) {
  log('[1/6] 检测到官方 app.asar 已更新，正在刷新 app.asar.orig 备份...');
  fs.copyFileSync(ASAR_PATH, ORIG_PATH);
  log('      原版备份已刷新: ' + ORIG_PATH);
} else {
  log('[1/6] 检测到已有备份 app.asar.orig，保留原始备份。');
}

// 2. 提取 app.asar 到临时目录
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-zh-'));
log('[2/6] 正在提取 app.asar 到临时工作区: ' + tempDir);
execSync(`${ASAR_CMD} extract "${ASAR_PATH}" "${tempDir}"`, { stdio: quiet ? 'ignore' : 'inherit' });

// 3. 写入 dist/i18nZh.js 运行时中文覆盖层
log('[3/6] 正在写入 dist/i18nZh.js 运行时中文覆盖层...');
const distDir = path.join(tempDir, 'dist');
fs.writeFileSync(path.join(distDir, 'i18nZh.js'), I18N_ZH_CONTENT, 'utf8');

// 4. 打补丁
log('[4/6] 正在应用源码与双通道注入补丁 (已启用防重复注入保护)...');

// 4.1 通道 A: dist/preload.js
const preloadPath = path.join(distDir, 'preload.js');
if (fs.existsSync(preloadPath)) {
let preloadContent = fs.readFileSync(preloadPath, 'utf8');

// 清理所有旧版/已有注入块
preloadContent = preloadContent.replace(/\/\* \[antigravity-zh-preload-start\] \*\/[\s\S]*?\/\* \[antigravity-zh-preload-end\] \*\/\r?\n?/g, '');
while (preloadContent.includes('/* [antigravity-zh-preload')) {
  const startIdx = preloadContent.indexOf('/* [antigravity-zh-preload');
  const catchIdx = preloadContent.indexOf('Preload injection failed', startIdx);
  if (catchIdx === -1) break;
  const endBraceIdx = preloadContent.indexOf('}\n', catchIdx);
  if (endBraceIdx === -1) break;
  preloadContent = preloadContent.slice(0, startIdx) + preloadContent.slice(endBraceIdx + 2);
}
preloadContent = preloadContent.replace(/\/\* \[antigravity-zh\] \*\/[^\n]*\r?\n/g, '');

const preloadInject = `/* [antigravity-zh-preload-start] */
try {
  const electron = require('electron');
  if (electron && electron.webFrame && typeof electron.webFrame.executeJavaScript === 'function') {
    electron.webFrame.executeJavaScript(` + JSON.stringify(OVERLAY_CODE) + `).catch(() => {});
  }
} catch (e) {
  console.error('[antigravity-zh] Preload injection failed:', e);
}
/* [antigravity-zh-preload-end] */
`;

preloadContent = preloadInject + preloadContent;
fs.writeFileSync(preloadPath, preloadContent, 'utf8');
log('  - dist/preload.js 注入完成 (已彻底清理旧注入并写入唯一块)');
}

// 4.2 通道 B: dist/utils.js
const utilsPath = path.join(distDir, 'utils.js');
if (fs.existsSync(utilsPath)) {
let utilsContent = fs.readFileSync(utilsPath, 'utf8');

// 彻底清除所有 utils 注入块（无论是成对标记还是单标记遗留，支持任意重复块完全清理）
utilsContent = utilsContent.replace(/\/\* \[antigravity-zh-utils-start\] \*\/[\s\S]*?\/\* \[antigravity-zh-utils-end\] \*\/\r?\n?/g, '');
while (utilsContent.includes('/* [antigravity-zh-utils')) {
  const startIdx = utilsContent.indexOf('/* [antigravity-zh-utils');
  const didFinishIdx = utilsContent.indexOf("'did-finish-load'", startIdx);
  if (didFinishIdx === -1) break;
  const endParenIdx = utilsContent.indexOf(';', didFinishIdx);
  if (endParenIdx === -1) break;
  utilsContent = utilsContent.slice(0, startIdx) + utilsContent.slice(endParenIdx + 1);
}

const utilsInject = `
/* [antigravity-zh-utils-start] */
    const __runZhOverlay = () => {
      try {
        if (!win.isDestroyed?.() && !hubContents.isDestroyed?.()) {
          hubContents.executeJavaScript(` + JSON.stringify(OVERLAY_CODE) + `).catch(() => {});
        }
      } catch (e) {}
    };
    hubContents.on?.('dom-ready', __runZhOverlay);
    hubContents.on?.('did-finish-load', __runZhOverlay);
/* [antigravity-zh-utils-end] */
`;

const anchor = 'const hubContents = getHubWebContents(win);';
const anchorIdx = utilsContent.indexOf(anchor);
if (anchorIdx !== -1) {
  utilsContent = utilsContent.slice(0, anchorIdx + anchor.length) + utilsInject + utilsContent.slice(anchorIdx + anchor.length);
} else {
  console.warn('[警告] 未找到 hubContents 锚点，降级跳过 utils.js 注入（依赖 preload 注入）');
}

fs.writeFileSync(utilsPath, utilsContent, 'utf8');
log('  - dist/utils.js 注入完成 (已清除所有历史块，保持唯一声明)');
}

// 4.3 menu.js
const menuPath = path.join(distDir, 'menu.js');
if (fs.existsSync(menuPath)) {
let menuContent = fs.readFileSync(menuPath, 'utf8');
if (!menuContent.includes('/* [antigravity-zh-menu] */')) {
  const localizeMenuCode = `
/* [antigravity-zh-menu] */
const MENU_ZH_MAP = {
  'File': '文件',
  'Edit': '编辑',
  'View': '视图',
  'Window': '窗口',
  'Help': '帮助',
  'New Window': '新建窗口',
  'Close Window': '关闭窗口',
  'Undo': '撤消',
  'Redo': '重做',
  'Cut': '剪切',
  'Copy': '复制',
  'Paste': '粘贴',
  'Paste and Match Style': '粘贴并匹配样式',
  'Select All': '全选',
  'Speech': '语音',
  'Start Speaking': '开始朗读',
  'Stop Speaking': '停止朗读',
  'Actual Size': '实际大小',
  'Zoom In': '放大',
  'Zoom Out': '缩小',
  'Reset Zoom': '重置缩放',
  'Toggle Full Screen': '切换全屏',
  'Minimize': '最小化',
  'Close': '关闭',
  'Docs': '文档',
  'Connect to WSL': '连接到 WSL',
  'Reopen Locally': '在本地重新打开',
  'Check for Updates': '检查更新',
  'Open Antigravity': '打开 Antigravity',
  'Quit': '退出'
};
function localizeNativeMenu(menu) {
  if (!menu || !Array.isArray(menu.items)) return;
  for (const item of menu.items) {
    if (item.label && MENU_ZH_MAP[item.label]) {
      item.label = MENU_ZH_MAP[item.label];
    }
    if (item.submenu) localizeNativeMenu(item.submenu);
  }
}
`;
  menuContent = localizeMenuCode + menuContent;
  menuContent = menuContent.replace("label: 'New Window'", "label: '新建窗口'");
  menuContent = menuContent.replace("label: 'Docs'", "label: '文档'");
  menuContent = menuContent.replace("label: item.label || 'Actual Size'", "label: item.label || '实际大小'");
  menuContent = menuContent.replace("label: item.label || 'Zoom In'", "label: item.label || '放大'");
  menuContent = menuContent.replace("label: item.label || 'Zoom Out'", "label: item.label || '缩小'");
  menuContent = menuContent.replace("return { label: 'Connect to WSL', submenu };", "return { label: '连接到 WSL', submenu };");
  menuContent = menuContent.replace("return { label: 'Reopen Locally', click: () => relaunchWithWslDistro('') };", "return { label: '在本地重新打开', click: () => relaunchWithWslDistro('') };");
  menuContent = menuContent.replace(/electron_1\.Menu\.setApplicationMenu\(menu\);/g, "localizeNativeMenu(menu); electron_1.Menu.setApplicationMenu(menu);");
  fs.writeFileSync(menuPath, menuContent, 'utf8');
}
log('  - dist/menu.js 原生菜单汉化就绪');
}

// 4.4 tray.js
const trayPath = path.join(distDir, 'tray.js');
if (fs.existsSync(trayPath)) {
let trayContent = fs.readFileSync(trayPath, 'utf8');
if (!trayContent.includes('/* [antigravity-zh-tray] */')) {
  trayContent = trayContent.replace(
    /countItem\.label\s*=\s*\((?:count\s*>\s*0\s*\?\s*`\${count}`\s*:\s*'No'\)\s*\+\s*' agent'\s*\+\s*\(count\s*===\s*1\s*\?\s*''\s*:\s*'s'\)\s*\+\s*' running';)/,
    "/* [antigravity-zh-tray] */ countItem.label = count > 0 ? `${count} 个智能体运行中` : '没有正在运行的智能体';"
  );
  fs.writeFileSync(trayPath, trayContent, 'utf8');
}
log('  - dist/tray.js 托盘提示汉化就绪');
}

// 4.5 main.js
const mainPath = path.join(distDir, 'main.js');
if (fs.existsSync(mainPath)) {
let mainContent = fs.readFileSync(mainPath, 'utf8');
if (!mainContent.includes('/* [antigravity-zh-main] */')) {
  mainContent = mainContent.replace("label: 'No agents running',", "/* [antigravity-zh-main] */ label: '没有正在运行的智能体',");
  mainContent = mainContent.replace("label: `Open ${electron_1.app.getName()}`,", "label: `打开 ${electron_1.app.getName()}`,");
  mainContent = mainContent.replace("label: 'Quit',", "label: '退出',");
  mainContent = mainContent.replace("label: 'New Window',", "label: '新建窗口',");
  fs.writeFileSync(mainPath, mainContent, 'utf8');
}
log('  - dist/main.js 托盘与Dock菜单汉化就绪');
}

// 4.6 provisionSplash.js
const splashPath = path.join(distDir, 'provisionSplash.js');
if (fs.existsSync(splashPath)) {
let splashContent = fs.readFileSync(splashPath, 'utf8');
if (!splashContent.includes('/* [antigravity-zh-splash] */')) {
  splashContent = splashContent.replace(
    "<div>Setting up WSL: ${escapeHtml(distro)}</div>",
    "/* [antigravity-zh-splash] */ <div>正在配置 WSL: ${escapeHtml(distro)}</div>"
  );
  fs.writeFileSync(splashPath, splashContent, 'utf8');
}
log('  - dist/provisionSplash.js WSL欢迎闪屏汉化就绪');
}

// 4.7 wizardHtml.js
const wizardPath = path.join(distDir, 'ideInstall', 'wizardHtml.js');
if (fs.existsSync(wizardPath)) {
  let wizardContent = fs.readFileSync(wizardPath, 'utf8');
  if (!wizardContent.includes('/* [antigravity-zh-wizard] */')) {
    wizardContent = wizardContent.replace("<title>Welcome to Antigravity</title>", "/* [antigravity-zh-wizard] */ <title>欢迎使用 Antigravity</title>");
    wizardContent = wizardContent.replace("Setting up…", "正在准备…");
    wizardContent = wizardContent.replace("<h1>Welcome to the new Antigravity!</h1>", "<h1>欢迎使用全新的 Antigravity！</h1>");
    wizardContent = wizardContent.replace(
      "Antigravity has been redesigned to put agents first with new capabilities. If you'd still like a code editor, you can download it as a separate app named <b>Antigravity IDE</b>.",
      "Antigravity 经过全新设计，以智能体优先并带来诸多新特性。如果您仍需要代码编辑器，可单独下载名为 <b>Antigravity IDE</b> 的配套应用。"
    );
    wizardContent = wizardContent.replace("<span>Download the Antigravity IDE</span>", "<span>下载 Antigravity IDE</span>");
    wizardContent = wizardContent.replace("<button class=\"btn-primary\" id=\"btn-skip\">Explore the new Antigravity</button>", "<button class=\"btn-primary\" id=\"btn-skip\">探索全新的 Antigravity</button>");
    fs.writeFileSync(wizardPath, wizardContent, 'utf8');
  }
  log('  - dist/ideInstall/wizardHtml.js IDE安装向导汉化就绪');
}


// 4.8 ipcHandlers.js (Native Context Menu Localization)
const ipcHandlersPath = path.join(distDir, 'ipcHandlers.js');
if (fs.existsSync(ipcHandlersPath)) {
  let ipcHandlersContent = fs.readFileSync(ipcHandlersPath, 'utf8');

  // 清理旧注入（如果存在）
  if (ipcHandlersContent.includes('/* [antigravity-zh-contextmenu] */')) {
    ipcHandlersContent = ipcHandlersContent.replace(/\/\* \[antigravity-zh-contextmenu\] \*\/[\s\S]*?\/\* \[antigravity-zh-contextmenu-end\] \*\/\r?\n?/g, '');
    ipcHandlersContent = ipcHandlersContent.replaceAll("label: localizeContextMenuLabel(item.label ?? ''),", "label: item.label ?? '',");
  }

  const contextMenuCode = `/* [antigravity-zh-contextmenu] */
const CONTEXT_MENU_ZH_MAP = {
  'Rename': '重命名',
  'Pin': '置顶',
  'Unpin': '取消置顶',
  'Mark Unread': '标为未读',
  'Mark Read': '标为已读',
  'Copy': '复制',
  'Fork': '派生 (Fork)',
  'Split': '拆分',
  'Share': '分享',
  'Stop': '停止',
  'Archive': '归档',
  'Unarchive': '取消归档',
  'Archive / Restore': '归档 / 恢复',
  'Delete': '删除',
  'Restore': '还原',
  'Delete Permanently': '永久删除',
  'View Debug': '查看调试信息',
  'Telemetry': '遥测',
  'Move to Group': '移动到分组',
  'New Group': '新建分组',
  'Remove from Group': '从分组中移除',
  'Conversation Name': '对话名称',
  'Conversation ID': '对话 ID',
  'Workspace Name': '工作区名称',
  'Worktree Name': 'Worktree 名称',
  'Project Name': '项目名称',
  'Split Right': '向右拆分',
  'Split Down': '向下拆分',
  'Split Up': '向上拆分',
  'Split Left': '向左拆分',
  'Replace with New': '替换为新对话',
  'Remove from Split': '从拆分中移除',
  'Undo': '撤消',
  'Redo': '重做',
  'Cut': '剪切',
  'Paste': '粘贴',
  'Paste and Match Style': '粘贴并匹配样式',
  'Select All': '全选',
  'Speech': '语音',
  'Start Speaking': '开始朗读',
  'Stop Speaking': '停止朗读',
  'Inspect Element': '检查元素',
  'Open Link': '打开链接',
  'Open Link in New Window': '在新窗口中打开链接',
  'Copy Link Address': '复制链接地址',
  'Save Image As...': '图片另存为...',
  'Copy Image': '复制图片',
  'Copy Image Address': '复制图片地址',
  'Reload': '重新加载',
  'Toggle Developer Tools': '切换开发者工具'
};

function localizeContextMenuLabel(label) {
  if (!label) return '';
  const trimmed = label.trim();
  try {
    const i18n = require('./i18nZh');
    if (i18n && i18n.DICTIONARY && i18n.DICTIONARY[trimmed]) {
      return i18n.DICTIONARY[trimmed];
    }
  } catch (e) {}
  if (CONTEXT_MENU_ZH_MAP[trimmed]) {
    return CONTEXT_MENU_ZH_MAP[trimmed];
  }
  if (/^Move to Group:\\s*(.*?)$/i.test(trimmed)) {
    return trimmed.replace(/^Move to Group:\\s*(.*?)$/i, '移动到分组：$1');
  }
  return label;
}
/* [antigravity-zh-contextmenu-end] */
`;

  const anchor = 'function buildContextMenuTemplate(items, onSelect) {';
  if (ipcHandlersContent.includes(anchor)) {
    ipcHandlersContent = ipcHandlersContent.replace(anchor, contextMenuCode + '\n' + anchor);
    ipcHandlersContent = ipcHandlersContent.replaceAll("label: item.label ?? '',", "label: localizeContextMenuLabel(item.label ?? ''),");
    fs.writeFileSync(ipcHandlersPath, ipcHandlersContent, 'utf8');
    log('  - dist/ipcHandlers.js 原生右键菜单汉化就绪');
  } else {
    console.warn('[警告] 未在 dist/ipcHandlers.js 找到 buildContextMenuTemplate 锚点');
  }
}

// 5. 重新打包为 app.asar
log('[5/6] 正在重新打包并写回 app.asar...');
const packedTempAsar = path.join(os.tmpdir(), 'agy-app-' + Date.now() + '.asar');
const unpackArgs = fs.existsSync(path.join(tempDir, 'node_modules', 'chrome-devtools-mcp'))
  ? ' --unpack-dir "node_modules/chrome-devtools-mcp"'
  : '';
execSync(`${ASAR_CMD} pack "${tempDir}" "${packedTempAsar}"${unpackArgs}`, { stdio: quiet ? 'ignore' : 'inherit' });

try {
  fs.copyFileSync(packedTempAsar, ASAR_PATH);
  fs.unlinkSync(packedTempAsar);
} catch (writeErr) {
  if (writeErr.code === 'EBUSY' || writeErr.code === 'EPERM' || writeErr.code === 'EACCES') {
    console.error('\n[错误] app.asar 当前被 Antigravity 进程锁定或权限不足，无法直接写回！');
    console.error('请完全退出 Antigravity（若安装在 Program Files 下请使用管理员权限运行），再重新运行此脚本。');
    process.exit(1);
  }
  throw writeErr;
}

// 清理解包临时目录
try {
  fs.rmSync(tempDir, { recursive: true, force: true });
} catch (e) {}

// 6. 验证
log('[6/6] 正在验证打包结果...');
const verifiedEntry = inspectAsarEntry(ASAR_PATH, ['dist', 'i18nZh.js']);
if (verifiedEntry && verifiedEntry.sha256 === EXPECTED_HASH) {
  const stat = fs.statSync(ASAR_PATH);
  log('      验证成功：i18nZh.js 已注入，文件大小: ' + stat.size + ' 字节');
  log('\n[完成] Antigravity 简体中文补丁已成功更新！');
  launchAntigravityApp();
} else {
  console.error('[警告] 验证失败：i18nZh.js 未在打包文件中找到或哈希不匹配！');
  process.exit(1);
}
