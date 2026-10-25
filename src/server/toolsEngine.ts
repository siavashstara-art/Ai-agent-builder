import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createBackup } from './backupManager.js';
import { validateCommand } from './commandSanitizer.js';

const execAsync = promisify(exec);
const WORKSPACE_ROOT = process.cwd();

export type ToolPermissionLevel = 'automatic' | 'user_approval';

export interface ToolDefinition {
  name: string;
  nameFa: string;
  description: string;
  permission: ToolPermissionLevel;
  parametersSchema: Record<string, any>;
  execute: (args: any, context?: any) => Promise<{ success: boolean; result: any; error?: string }>;
}

export interface ToolExecutionLog {
  id: string;
  toolName: string;
  args: any;
  result?: any;
  error?: string;
  timestamp: string;
  permissionUsed: ToolPermissionLevel;
  status: 'success' | 'failed' | 'rejected';
}

const toolLogs: ToolExecutionLog[] = [];

/**
 * Ensures path stays within workspace boundaries
 */
function resolveSafePath(filePath: string): string {
  const absolutePath = path.resolve(WORKSPACE_ROOT, filePath);
  if (!absolutePath.startsWith(WORKSPACE_ROOT)) {
    throw new Error('دسترسـی خارج از محدودهٔ پروژه مجاز نیست.');
  }
  return absolutePath;
}

// Global tool registry map
const toolsRegistry: Record<string, ToolDefinition> = {};

// 1. Tool: read_file
toolsRegistry['read_file'] = {
  name: 'read_file',
  nameFa: 'خواندن فایل',
  description: 'خواندن محتوای متنی یک فایل در محدودهٔ پروژه',
  permission: 'automatic',
  parametersSchema: {
    type: 'object',
    properties: {
      filePath: { type: 'string', description: 'مسیر نسبی فایل نسبت به ریشه پروژه' },
    },
    required: ['filePath'],
  },
  execute: async (args) => {
    try {
      const fullPath = resolveSafePath(args.filePath);
      if (!fs.existsSync(fullPath)) {
        return { success: false, result: null, error: `فایل ${args.filePath} یافت نشد.` };
      }
      const content = fs.readFileSync(fullPath, 'utf-8');
      return {
        success: true,
        result: {
          filePath: args.filePath,
          content: content.length > 50000 ? content.substring(0, 50000) + '\n... [محتوا خلاصه شده است]' : content,
          linesCount: content.split('\n').length,
          sizeBytes: Buffer.byteLength(content, 'utf-8'),
        },
      };
    } catch (err: any) {
      return { success: false, result: null, error: err.message };
    }
  },
};

// 2. Tool: write_file
toolsRegistry['write_file'] = {
  name: 'write_file',
  nameFa: 'نوشتن و ویرایش فایل',
  description: 'ایجاد یا به‌روزرسانی محتوای فایل همراه با ساخت نسخهٔ پشتیبان خودکار',
  permission: 'user_approval',
  parametersSchema: {
    type: 'object',
    properties: {
      filePath: { type: 'string', description: 'مسیر نسبی فایل' },
      content: { type: 'string', description: 'محتوای متنی فایل' },
    },
    required: ['filePath', 'content'],
  },
  execute: async (args) => {
    try {
      const fullPath = resolveSafePath(args.filePath);
      
      // Backup if existing
      let backupInfo = null;
      if (fs.existsSync(fullPath)) {
        backupInfo = createBackup(args.filePath);
      } else {
        // Ensure parent dir exists
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      }

      fs.writeFileSync(fullPath, args.content, 'utf-8');

      return {
        success: true,
        result: {
          filePath: args.filePath,
          writtenBytes: Buffer.byteLength(args.content, 'utf-8'),
          backupCreated: backupInfo ? backupInfo.backupPath : null,
          message: 'فایل با موفقیت ذخیره شد.',
        },
      };
    } catch (err: any) {
      return { success: false, result: null, error: err.message };
    }
  },
};

// 3. Tool: list_files
toolsRegistry['list_files'] = {
  name: 'list_files',
  nameFa: 'فهرست‌گیری فایل‌ها',
  description: 'لیست‌کردن فایل‌ها و پوشه‌های یک مسیر از پروژه',
  permission: 'automatic',
  parametersSchema: {
    type: 'object',
    properties: {
      dirPath: { type: 'string', description: 'مسیر پوشه (پیش‌فرض .) ' },
    },
  },
  execute: async (args) => {
    try {
      const relativeDir = args.dirPath || '.';
      const fullPath = resolveSafePath(relativeDir);

      if (!fs.existsSync(fullPath)) {
        return { success: false, result: null, error: `پوشه ${relativeDir} وجود ندارد.` };
      }

      const entries = fs.readdirSync(fullPath, { withFileTypes: true });
      const items = entries
        .filter(entry => !entry.name.startsWith('.git') && entry.name !== 'node_modules' && entry.name !== '.tavana_backups')
        .map(entry => {
          const itemPath = path.join(relativeDir, entry.name);
          return {
            name: entry.name,
            path: itemPath,
            isDirectory: entry.isDirectory(),
          };
        });

      return {
        success: true,
        result: {
          dirPath: relativeDir,
          items,
          totalCount: items.length,
        },
      };
    } catch (err: any) {
      return { success: false, result: null, error: err.message };
    }
  },
};

// 4. Tool: run_command
toolsRegistry['run_command'] = {
  name: 'run_command',
  nameFa: 'اجرای فرمان ترمینال',
  description: 'اجرای کنترل‌شدهٔ فرمان‌های شل در محیط پروژه',
  permission: 'user_approval',
  parametersSchema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'فرمان ترمینال جهت اجرا' },
    },
    required: ['command'],
  },
  execute: async (args) => {
    const val = validateCommand(args.command);
    if (!val.safe) {
      return { success: false, result: null, error: val.reason };
    }

    try {
      const { stdout, stderr } = await execAsync(val.sanitizedCommand, {
        cwd: WORKSPACE_ROOT,
        timeout: 30000,
      });

      return {
        success: true,
        result: {
          command: val.sanitizedCommand,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: 0,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        result: {
          command: val.sanitizedCommand,
          stdout: err.stdout ? String(err.stdout).trim() : '',
          stderr: err.stderr ? String(err.stderr).trim() : '',
          exitCode: err.code || 1,
        },
        error: `فرمان با خطای خروجی خاتمه یافت: ${err.message}`,
      };
    }
  },
};

// 5. Tool: run_build
toolsRegistry['run_build'] = {
  name: 'run_build',
  nameFa: 'بررسی Build و تایپ‌ها',
  description: 'اجرای بررسی کدهای تایپ اسکریپت و سنجش سلامت کامپایل پروژه',
  permission: 'automatic',
  parametersSchema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    try {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit', {
        cwd: WORKSPACE_ROOT,
        timeout: 25000,
      });

      return {
        success: true,
        result: {
          status: 'BUILD_SUCCESS',
          message: 'کامپایل پروژه بدون خطای TypeScript انجام شد.',
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        },
      };
    } catch (err: any) {
      return {
        success: false,
        result: {
          status: 'BUILD_FAILED',
          message: 'خطا در کامپایل تایپ اسکریپت یافت شد.',
          stdout: err.stdout ? String(err.stdout).trim() : '',
          stderr: err.stderr ? String(err.stderr).trim() : '',
        },
        error: `خطای کامپایل TypeScript: ${err.message}`,
      };
    }
  },
};

// 6. Tool: run_tests
toolsRegistry['run_tests'] = {
  name: 'run_tests',
  nameFa: 'اجرای آزمون‌های هسته سیستم',
  description: 'ارزیابی خودکار زیرسیستم‌های اصلی عامل توانا همراه با ثبت مستندات موفقیت/شکست',
  permission: 'automatic',
  parametersSchema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    // We will dynamically import the test runner to avoid cyclic imports
    try {
      const { runSystemTests } = await import('./testRunner.js');
      const testReport = await runSystemTests();
      return {
        success: testReport.allPassed,
        result: testReport,
        error: testReport.allPassed ? undefined : 'برخی آزمون‌های هسته ناموفق بودند.',
      };
    } catch (err: any) {
      return { success: false, result: null, error: err.message };
    }
  },
};

// 7. Tool: github_status
toolsRegistry['github_status'] = {
  name: 'github_status',
  nameFa: 'بررسی وضعیت Git/GitHub',
  description: 'نمایش شاخهٔ جاری، تغییرات آمادهٔ Commit و وضعیت ریپازیتوری',
  permission: 'automatic',
  parametersSchema: {
    type: 'object',
    properties: {},
  },
  execute: async () => {
    try {
      const { stdout: statusOut } = await execAsync('git status --short', { cwd: WORKSPACE_ROOT });
      const { stdout: branchOut } = await execAsync('git branch --show-current', { cwd: WORKSPACE_ROOT }).catch(() => ({ stdout: 'main' }));
      const { stdout: logOut } = await execAsync('git log -n 5 --oneline', { cwd: WORKSPACE_ROOT }).catch(() => ({ stdout: 'بدون کامیت' }));

      return {
        success: true,
        result: {
          branch: branchOut.trim() || 'main',
          changes: statusOut.trim().split('\n').filter(Boolean),
          recentCommits: logOut.trim().split('\n').filter(Boolean),
        },
      };
    } catch (err: any) {
      return { success: false, result: null, error: `خطا در دریافت وضعیت گیت: ${err.message}` };
    }
  },
};

// 8. Tool: github_commit
toolsRegistry['github_commit'] = {
  name: 'github_commit',
  nameFa: 'ثبت تغییرات (Git Commit)',
  description: 'افزودن تغییرات و ثبت کامیت با پیام مشخص (با تأیید کاربر)',
  permission: 'user_approval',
  parametersSchema: {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'پیام کامیت' },
    },
    required: ['message'],
  },
  execute: async (args) => {
    try {
      await execAsync('git add .', { cwd: WORKSPACE_ROOT });
      const { stdout } = await execAsync(`git commit -m "${args.message.replace(/"/g, '\\"')}"`, { cwd: WORKSPACE_ROOT });
      return {
        success: true,
        result: {
          message: 'کامیت با موفقیت ثبت شد.',
          stdout: stdout.trim(),
        },
      };
    } catch (err: any) {
      return { success: false, result: null, error: `خطا در ثبت کامیت: ${err.message}` };
    }
  },
};

// 9. Tool: app_exporter
toolsRegistry['app_exporter'] = {
  name: 'app_exporter',
  nameFa: 'تولید ساختار برنامه‌های جانبی',
  description: 'تولید قالب‌های آماده برای ربات تلگرام، بازی وب، برنامه‌های اندروید یا وب‌اپلیکیشن مستقل',
  permission: 'automatic',
  parametersSchema: {
    type: 'object',
    properties: {
      targetType: { 
        type: 'string', 
        enum: ['telegram_bot', 'android_pwa', 'mini_game', 'web_app'], 
        description: 'نوع برنامه خروجی' 
      },
      appName: { type: 'string', description: 'نام پروژه خروجی' },
    },
    required: ['targetType', 'appName'],
  },
  execute: async (args) => {
    const { targetType, appName } = args;
    const exportFolder = path.join(WORKSPACE_ROOT, 'exports', appName);
    fs.mkdirSync(exportFolder, { recursive: true });

    let filesCreated: string[] = [];

    if (targetType === 'telegram_bot') {
      const botCode = `/**
 * Telegram Bot Blueprint generated by TAVANA AI Agent
 * Target: ${appName}
 */
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN');

bot.start((ctx) => ctx.reply('سلام! به ربات ${appName} ساخته‌شده توسط TAVANA AI خوش آمدید.'));
bot.help((ctx) => ctx.reply('راهنما: برای پشتیبانی پیام بفرستید.'));

bot.on('text', (ctx) => {
  ctx.reply('پیام شما دریافت شد: ' + ctx.message.text);
});

console.log('ربات ${appName} در حال اجراست...');
bot.launch();
`;
      const filePath = path.join(exportFolder, 'bot.js');
      fs.writeFileSync(filePath, botCode, 'utf-8');
      filesCreated.push(path.relative(WORKSPACE_ROOT, filePath));
    } else if (targetType === 'android_pwa') {
      const manifest = {
        name: appName,
        short_name: appName,
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0284c7',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      };
      const filePath = path.join(exportFolder, 'manifest.json');
      fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2), 'utf-8');
      filesCreated.push(path.relative(WORKSPACE_ROOT, filePath));
    } else if (targetType === 'mini_game') {
      const htmlCode = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${appName} - Mini Game</title>
  <style>
    body { background: #0f172a; color: white; text-align: center; font-family: sans-serif; padding-top: 50px; }
    canvas { background: #1e293b; border: 2px solid #38bdf8; border-radius: 8px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>بازی ${appName}</h1>
  <p>ساخته‌شده توسط TAVANA AI Agent</p>
  <canvas id="gameCanvas" width="400" height="400"></canvas>
  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(150, 150, 100, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Vazirmatn, sans-serif';
    ctx.fillText('نمونه بازی ۲ بعدی', 130, 270);
  </script>
</body>
</html>`;
      const filePath = path.join(exportFolder, 'index.html');
      fs.writeFileSync(filePath, htmlCode, 'utf-8');
      filesCreated.push(path.relative(WORKSPACE_ROOT, filePath));
    }

    return {
      success: true,
      result: {
        appName,
        targetType,
        outputDirectory: path.relative(WORKSPACE_ROOT, exportFolder),
        filesCreated,
        message: `ساختار قالب ${targetType} برای پروژه ${appName} آماده شد.`,
      },
    };
  },
};

/**
 * Gets all tool definitions
 */
export function getAllTools(): ToolDefinition[] {
  return Object.values(toolsRegistry);
}

/**
 * Gets specific tool by name
 */
export function getTool(name: string): ToolDefinition | undefined {
  return toolsRegistry[name];
}

/**
 * Executes a tool with permission audit logs
 */
export async function executeTool(
  name: string,
  args: any,
  userConfirmed: boolean = false
): Promise<{ success: boolean; result: any; error?: string; permissionRequired?: boolean }> {
  const tool = getTool(name);
  if (!tool) {
    return { success: false, result: null, error: `ابزار ${name} شناسایی نشد.` };
  }

  // Permission Check
  if (tool.permission === 'user_approval' && !userConfirmed) {
    const logItem: ToolExecutionLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      toolName: name,
      args,
      timestamp: new Date().toISOString(),
      permissionUsed: tool.permission,
      status: 'rejected',
      error: 'نیازمند تأیید صریح کاربر پیش از اجرا',
    };
    toolLogs.unshift(logItem);
    return {
      success: false,
      result: null,
      error: `عملیات حساس (${tool.nameFa}) نیازمند تأیید کاربر است.`,
      permissionRequired: true,
    };
  }

  const res = await tool.execute(args);

  const logItem: ToolExecutionLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    toolName: name,
    args,
    result: res.result,
    error: res.error,
    timestamp: new Date().toISOString(),
    permissionUsed: tool.permission,
    status: res.success ? 'success' : 'failed',
  };

  toolLogs.unshift(logItem);
  if (toolLogs.length > 100) toolLogs.pop();

  return res;
}

/**
 * Retrieves tool execution logs
 */
export function getToolExecutionLogs(): ToolExecutionLog[] {
  return [...toolLogs];
}
