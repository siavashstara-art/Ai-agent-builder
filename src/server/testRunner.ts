import { executeTool } from './toolsEngine.js';
import { validateCommand } from './commandSanitizer.js';
import { createBackup, getBackupsList } from './backupManager.js';
import fs from 'fs';
import path from 'path';

export interface TestResultItem {
  id: string;
  nameFa: string;
  category: string;
  passed: boolean;
  durationMs: number;
  details: string;
  error?: string;
}

export interface SystemTestReport {
  timestamp: string;
  totalTests: number;
  passCount: number;
  failCount: number;
  allPassed: boolean;
  results: TestResultItem[];
}

export async function runSystemTests(): Promise<SystemTestReport> {
  const results: TestResultItem[] = [];

  // Test 1: File Manager & Read File Tool Test
  const t1Start = Date.now();
  try {
    const res1 = await executeTool('read_file', { filePath: 'package.json' });
    if (res1.success && res1.result && res1.result.filePath === 'package.json') {
      results.push({
        id: 'test_1_read_file',
        nameFa: 'آزمون خواندن فایل پروژه (read_file)',
        category: 'سیستم فایل',
        passed: true,
        durationMs: Date.now() - t1Start,
        details: `موفق: خواندن فایل package.json با حجم ${res1.result.sizeBytes} بایت.`,
      });
    } else {
      results.push({
        id: 'test_1_read_file',
        nameFa: 'آزمون خواندن فایل پروژه (read_file)',
        category: 'سیستم فایل',
        passed: false,
        durationMs: Date.now() - t1Start,
        details: 'خروجی متناسب با فایل دریافت نشد.',
        error: res1.error,
      });
    }
  } catch (err: any) {
    results.push({
      id: 'test_1_read_file',
      nameFa: 'آزمون خواندن فایل پروژه (read_file)',
      category: 'سیستم فایل',
      passed: false,
      durationMs: Date.now() - t1Start,
      details: 'استثنا در زمان اجرا',
      error: err.message,
    });
  }

  // Test 2: Directory List Tool Test
  const t2Start = Date.now();
  try {
    const res2 = await executeTool('list_files', { dirPath: '.' });
    if (res2.success && Array.isArray(res2.result?.items)) {
      results.push({
        id: 'test_2_list_files',
        nameFa: 'آزمون پیمایش پوشه ریشه (list_files)',
        category: 'سیستم فایل',
        passed: true,
        durationMs: Date.now() - t2Start,
        details: `موفق: تعداد ${res2.result.totalCount} عنصر در پوشه ریشه شناسایی شد.`,
      });
    } else {
      results.push({
        id: 'test_2_list_files',
        nameFa: 'آزمون پیمایش پوشه ریشه (list_files)',
        category: 'سیستم فایل',
        passed: false,
        durationMs: Date.now() - t2Start,
        details: 'لیست فایل‌ها دریافت نشد.',
        error: res2.error,
      });
    }
  } catch (err: any) {
    results.push({
      id: 'test_2_list_files',
      nameFa: 'آزمون پیمایش پوشه ریشه (list_files)',
      category: 'سیستم فایل',
      passed: false,
      durationMs: Date.now() - t2Start,
      details: 'استثنا در زمان اجرا',
      error: err.message,
    });
  }

  // Test 3: Command Sanitizer Security Test
  const t3Start = Date.now();
  try {
    const dangerousCheck = validateCommand('rm -rf /');
    const safeCheck = validateCommand('pwd');
    if (!dangerousCheck.safe && safeCheck.safe) {
      results.push({
        id: 'test_3_command_sanitizer',
        nameFa: 'آزمون فیلتر امنیتی فرمان‌ها (Command Sanitizer)',
        category: 'امنیتی',
        passed: true,
        durationMs: Date.now() - t3Start,
        details: 'موفق: فرمان تخریبی rm -rf / مسدود شد و فرمان ایمن pwd مجوز گرفت.',
      });
    } else {
      results.push({
        id: 'test_3_command_sanitizer',
        nameFa: 'آزمون فیلتر امنیتی فرمان‌ها (Command Sanitizer)',
        category: 'امنیتی',
        passed: false,
        durationMs: Date.now() - t3Start,
        details: 'رفتار ایمنی با انتظار مطابقت نداشت.',
      });
    }
  } catch (err: any) {
    results.push({
      id: 'test_3_command_sanitizer',
      nameFa: 'آزمون فیلتر امنیتی فرمان‌ها (Command Sanitizer)',
      category: 'امنیتی',
      passed: false,
      durationMs: Date.now() - t3Start,
      details: 'خطا در بررسی سلامت فرمان',
      error: err.message,
    });
  }

  // Test 4: Backup Manager Snapshot Test
  const t4Start = Date.now();
  try {
    const tempFile = 'temp_test_backup.txt';
    fs.writeFileSync(tempFile, 'Tavana AI Test Backup Content', 'utf-8');
    const backupRecord = createBackup(tempFile);
    fs.unlinkSync(tempFile); // cleanup

    if (backupRecord && backupRecord.backupPath) {
      results.push({
        id: 'test_4_backup_manager',
        nameFa: 'آزمون ایجاد نسخهٔ پشتیبان (Backup Manager)',
        category: 'سیستم فایل',
        passed: true,
        durationMs: Date.now() - t4Start,
        details: `موفق: نسخه پشتیبان در مسیر ${backupRecord.backupPath} ثبت گردید.`,
      });
    } else {
      results.push({
        id: 'test_4_backup_manager',
        nameFa: 'آزمون ایجاد نسخهٔ پشتیبان (Backup Manager)',
        category: 'سیستم فایل',
        passed: false,
        durationMs: Date.now() - t4Start,
        details: 'ثبت پشتبان ناموفق بود.',
      });
    }
  } catch (err: any) {
    results.push({
      id: 'test_4_backup_manager',
      nameFa: 'آزمون ایجاد نسخهٔ پشتیبان (Backup Manager)',
      category: 'سیستم فایل',
      passed: false,
      durationMs: Date.now() - t4Start,
      details: 'خطا در آزمون پشتبان‌گیری',
      error: err.message,
    });
  }

  // Test 5: Permission & Approval Enforcement Test
  const t5Start = Date.now();
  try {
    const unapprovedRes = await executeTool('run_command', { command: 'echo "test"' }, false);
    if (unapprovedRes.permissionRequired) {
      results.push({
        id: 'test_5_permission_check',
        nameFa: 'آزمون الزام تأیید کاربر برای ابزارهای حساس',
        category: 'امنیتی',
        passed: true,
        durationMs: Date.now() - t5Start,
        details: 'موفق: اجرای ابزار حساس بدون تأیید صریح کاربر مسدود شد.',
      });
    } else {
      results.push({
        id: 'test_5_permission_check',
        nameFa: 'آزمون الزام تأیید کاربر برای ابزارهای حساس',
        category: 'امنیتی',
        passed: false,
        durationMs: Date.now() - t5Start,
        details: 'کنترل مجوز بدرستی عمل نکرد.',
      });
    }
  } catch (err: any) {
    results.push({
      id: 'test_5_permission_check',
      nameFa: 'آزمون الزام تأیید کاربر برای ابزارهای حساس',
      category: 'امنیتی',
      passed: false,
      durationMs: Date.now() - t5Start,
      details: 'استثنا در آزمون مجوزها',
      error: err.message,
    });
  }

  const passCount = results.filter(r => r.passed).length;
  const failCount = results.length - passCount;

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passCount,
    failCount,
    allPassed: failCount === 0,
    results,
  };
}
