import fs from 'fs';
import path from 'path';

const WORKSPACE_ROOT = process.cwd();
const BACKUP_DIR = path.join(WORKSPACE_ROOT, '.tavana_backups');

export interface BackupRecord {
  id: string;
  originalPath: string;
  backupPath: string;
  timestamp: string;
  size: number;
}

const backups: BackupRecord[] = [];

/**
 * Ensures backup directory exists
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Creates a backup copy of a file before modifying or deleting it
 */
export function createBackup(relativeFilePath: string): BackupRecord | null {
  try {
    ensureBackupDir();
    const fullPath = path.resolve(WORKSPACE_ROOT, relativeFilePath);
    
    // Safety check: ensure file is within workspace
    if (!fullPath.startsWith(WORKSPACE_ROOT)) {
      throw new Error('مسیر فایل خارج از محدودهٔ پروژه است.');
    }

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      return null;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeFileName = path.basename(relativeFilePath).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const backupFileName = `${timestamp}_${safeFileName}`;
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    fs.copyFileSync(fullPath, backupPath);

    const record: BackupRecord = {
      id: `bkp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      originalPath: relativeFilePath,
      backupPath: path.relative(WORKSPACE_ROOT, backupPath),
      timestamp: new Date().toISOString(),
      size: stat.size,
    };

    backups.unshift(record);
    // Keep max 50 backups
    if (backups.length > 50) {
      const removed = backups.pop();
      if (removed) {
        const rmPath = path.join(WORKSPACE_ROOT, removed.backupPath);
        if (fs.existsSync(rmPath)) {
          try { fs.unlinkSync(rmPath); } catch (_) {}
        }
      }
    }

    return record;
  } catch (err: any) {
    console.error('Backup creation error:', err.message);
    return null;
  }
}

/**
 * Restores a file from backup record ID
 */
export function restoreBackup(backupId: string): { success: boolean; message: string } {
  const record = backups.find(b => b.id === backupId);
  if (!record) {
    return { success: false, message: 'شناسهٔ نسخهٔ پشتیبان یافت نشد.' };
  }

  const backupFullPath = path.join(WORKSPACE_ROOT, record.backupPath);
  const targetFullPath = path.join(WORKSPACE_ROOT, record.originalPath);

  if (!fs.existsSync(backupFullPath)) {
    return { success: false, message: 'فایل نسخهٔ پشتیبان روی دیسک وجود ندارد.' };
  }

  try {
    // Ensure target parent directory exists
    fs.mkdirSync(path.dirname(targetFullPath), { recursive: true });
    fs.copyFileSync(backupFullPath, targetFullPath);
    return { 
      success: true, 
      message: `فایل ${record.originalPath} با موفقیت از نسخهٔ پشتیبان بازیابی شد.` 
    };
  } catch (err: any) {
    return { success: false, message: `خطا در بازیابی: ${err.message}` };
  }
}

/**
 * Gets list of all created backups
 */
export function getBackupsList(): BackupRecord[] {
  return [...backups];
}
