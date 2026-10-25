import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getAllTools, executeTool, getToolExecutionLogs } from './src/server/toolsEngine.js';
import { generateAgentChat, generateTaskPlan, fixCodeFromError } from './src/server/aiService.js';
import { runSystemTests } from './src/server/testRunner.js';
import { getBackupsList, restoreBackup } from './src/server/backupManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// REST API Endpoints for Tavana AI Agent Core

// 1. System Environment Status Endpoint
app.get('/api/agent/status', (req, res) => {
  const hasApiKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    appName: 'TAVANA AI Agent Core',
    version: '1.0.0',
    status: 'ONLINE',
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      hasGeminiApiKey: hasApiKey,
    },
    capabilities: [
      { key: 'file_operations', label: 'خواندن و نوشتن فایل‌های پروژه', active: true },
      { key: 'command_execution', label: 'اجرای فرمان‌های ایزوله شل', active: true },
      { key: 'build_and_test', label: 'تست کامپایل و سنجش سلامت کد', active: true },
      { key: 'git_integration', label: 'مدیریت و ثبت کامیت‌های Git', active: true },
      { key: 'app_exporter', label: 'تولید خروجی ربات تلگرام، بازی و PWA', active: true },
      { key: 'ai_pipeline', label: 'مدل هوش مصنوعی Gemini 3.8 / 4.0', active: hasApiKey },
    ],
    timestamp: new Date().toISOString(),
  });
});

// 2. Tools Registry Endpoint
app.get('/api/agent/tools', (req, res) => {
  const tools = getAllTools().map(t => ({
    name: t.name,
    nameFa: t.nameFa,
    description: t.description,
    permission: t.permission,
    parametersSchema: t.parametersSchema,
  }));
  res.json({ success: true, count: tools.length, tools });
});

// 3. Tool Execution Endpoint
app.post('/api/agent/tools/execute', async (req, res) => {
  try {
    const { toolName, args, userConfirmed } = req.body;
    if (!toolName) {
      return res.status(400).json({ success: false, error: 'نام ابزار ارسالی مشخص نیست.' });
    }

    const result = await executeTool(toolName, args || {}, Boolean(userConfirmed));
    if (result.permissionRequired) {
      return res.status(403).json(result);
    }
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. AI Chat Endpoint
app.post('/api/agent/chat', async (req, res) => {
  try {
    const { messages, selectedModel } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, error: 'لیست پیام‌ها نامعتبر است.' });
    }

    const aiRes = await generateAgentChat(messages, selectedModel || 'gemini-3.8-flash');
    res.json({ success: true, response: aiRes.text, modelUsed: aiRes.modelUsed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Task Planner Endpoint
app.post('/api/agent/task/plan', async (req, res) => {
  try {
    const { goal, selectedModel } = req.body;
    if (!goal) {
      return res.status(400).json({ success: false, error: 'هدف تعریف نشده است.' });
    }

    const plan = await generateTaskPlan(goal, selectedModel || 'gemini-3.8-flash');
    res.json({ success: true, plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Code Fix Endpoint
app.post('/api/agent/task/fix-code', async (req, res) => {
  try {
    const { filePath, currentCode, errorLog } = req.body;
    if (!filePath || !currentCode || !errorLog) {
      return res.status(400).json({ success: false, error: 'اطلاعات کامل خطا و کد ارسال نشده است.' });
    }

    const fixed = await fixCodeFromError(filePath, currentCode, errorLog);
    res.json({ success: true, ...fixed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Audit Logs Endpoint
app.get('/api/agent/logs', (req, res) => {
  res.json({ success: true, logs: getToolExecutionLogs() });
});

// 8. Automated Test Suite Endpoint
app.post('/api/agent/tests', async (req, res) => {
  try {
    const testReport = await runSystemTests();
    res.json({ success: true, report: testReport });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Backups List Endpoint
app.get('/api/agent/backups', (req, res) => {
  res.json({ success: true, backups: getBackupsList() });
});

// 10. Backup Restore Endpoint
app.post('/api/agent/backups/restore', (req, res) => {
  const { backupId } = req.body;
  if (!backupId) {
    return res.status(400).json({ success: false, error: 'شناسه پشتبان ارسال نشده است.' });
  }
  const result = restoreBackup(backupId);
  res.json(result);
});

// Vite Middleware Setup in Dev Mode or Static Files Serving in Production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 TAVANA AI Agent Core Server running at http://0.0.0.0:${PORT}\n`);
  });
}

startServer();
