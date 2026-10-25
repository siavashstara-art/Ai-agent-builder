import React, { useState, useEffect } from 'react';
import { FolderTree, FileText, Folder, RotateCcw, Eye, RefreshCw, Save, CheckCircle2 } from 'lucide-react';
import { BackupRecord } from '../types/agent';

interface FileManagerProps {
  onReadFile: (filePath: string) => Promise<any>;
  onWriteFile: (filePath: string, content: string) => Promise<any>;
  onListFiles: (dirPath: string) => Promise<any>;
  backups: BackupRecord[];
  onRestoreBackup: (backupId: string) => Promise<any>;
  onRequestApproval: (title: string, description: string, onApprove: () => void) => void;
}

export const FileManager: React.FC<FileManagerProps> = ({
  onReadFile,
  onWriteFile,
  onListFiles,
  backups,
  onRestoreBackup,
  onRequestApproval,
}) => {
  const [currentDir, setCurrentDir] = useState('.');
  const [dirItems, setDirItems] = useState<Array<{ name: string; path: string; isDirectory: boolean }>>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('package.json');
  const [fileContent, setFileContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDirectory = async (dir: string) => {
    setLoading(true);
    const res = await onListFiles(dir);
    if (res.success && res.result?.items) {
      setDirItems(res.result.items);
      setCurrentDir(dir);
    }
    setLoading(false);
  };

  const handleOpenFile = async (filePath: string) => {
    setLoading(true);
    setSelectedFilePath(filePath);
    const res = await onReadFile(filePath);
    if (res.success && res.result?.content) {
      setFileContent(res.result.content);
      setEditedContent(res.result.content);
    } else {
      setFileContent(`[خطا در خواندن فایل: ${res.error || 'ناشناخته'}]`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDirectory('.');
    handleOpenFile('package.json');
  }, []);

  const handleSaveFile = () => {
    onRequestApproval(
      `ذخیره تغییرات در فایل ${selectedFilePath}`,
      `با ذخیره‌سازی، یک نسخهٔ پشتیبان خودکار از فایل قبلی ساخته شده و محتوای جدید جایگزین می‌شود.`,
      async () => {
        setLoading(true);
        const res = await onWriteFile(selectedFilePath, editedContent);
        if (res.success) {
          setFileContent(editedContent);
          setIsEditing(false);
        }
        setLoading(false);
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Title */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-lg">
            <FolderTree className="w-5 h-5 text-cyan-400" />
            <span>مدیریت فایل و کدهای پروژه</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            مشاهده، ویرایش ایمن همراه با نسخهٔ پشتیبان خودکار پیش از اعمال تغییرات
          </p>
        </div>
        <button
          onClick={() => fetchDirectory(currentDir)}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Directory Explorer */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span>مسیر فعلی: <code className="text-cyan-300 font-mono">{currentDir}</code></span>
            {currentDir !== '.' && (
              <button
                onClick={() => fetchDirectory('.')}
                className="text-cyan-400 hover:underline"
              >
                بازگشت به ریشه
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-[450px] overflow-y-auto pr-1">
            {dirItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  if (item.isDirectory) {
                    fetchDirectory(item.path);
                  } else {
                    handleOpenFile(item.path);
                  }
                }}
                className={`w-full text-right px-3 py-2 rounded-xl text-xs flex items-center gap-2 transition ${
                  selectedFilePath === item.path
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                {item.isDirectory ? (
                  <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* File Content & Editor */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs font-bold text-slate-200">{selectedFilePath}</span>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleSaveFile}
                    className="px-3 py-1 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>ذخیره تغییرات</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 text-xs text-cyan-400 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-lg"
                >
                  ویرایش فایل
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={18}
              className="w-full bg-slate-950 font-mono text-xs text-cyan-200 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none leading-relaxed"
            />
          ) : (
            <pre className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-slate-300 max-h-[420px] overflow-auto border border-slate-800 leading-relaxed whitespace-pre-wrap">
              {fileContent}
            </pre>
          )}
        </div>
      </div>

      {/* Backup History List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-cyan-400" />
          <span>تاریخچه نسخه‌های پشتیبان (File Backups)</span>
        </h3>

        {backups.length === 0 ? (
          <p className="text-xs text-slate-500 italic">هنوز نسخه پشتیبانی ساخته نشده است.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {backups.map((bkp) => (
              <div
                key={bkp.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-mono text-cyan-300 font-semibold">{bkp.originalPath}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    پشتیبان: {bkp.backupPath} | تاریخ: {new Date(bkp.timestamp).toLocaleString('fa-IR')}
                  </div>
                </div>

                <button
                  onClick={() => onRestoreBackup(bkp.id)}
                  className="px-3 py-1 bg-amber-950/60 hover:bg-amber-900/60 text-amber-400 border border-amber-800/60 rounded-lg transition text-[11px] font-semibold"
                >
                  بازیابی این نسخه
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
