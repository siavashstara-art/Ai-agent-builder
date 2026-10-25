import React, { useState } from 'react';
import { Terminal, X, CheckCircle2, XCircle, ShieldAlert, RefreshCw } from 'lucide-react';
import { ToolLog } from '../types/agent';

interface ActivityLogsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ToolLog[];
  onRefreshLogs: () => Promise<void>;
}

export const ActivityLogsDrawer: React.FC<ActivityLogsDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onRefreshLogs,
}) => {
  const [filter, setFilter] = useState<'all' | 'success' | 'rejected' | 'failed'>('all');

  if (!isOpen) return null;

  const filteredLogs = logs.filter(l => {
    if (filter === 'all') return true;
    return l.status === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-base">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span>گزارش عملکرد و لاگ‌های سیستم (Audit Logs)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshLogs}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {(['all', 'success', 'rejected', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                filter === f ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'all' && 'همه'}
              {f === 'success' && 'موفق'}
              {f === 'rejected' && 'ردشده (مجوز)'}
              {f === 'failed' && 'خطادار'}
            </button>
          ))}
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">هیچ لاگی ثبت نشده است.</div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-300">{log.toolName}</span>
                  <span
                    className={`px-2 py-0.2 rounded text-[10px] font-semibold flex items-center gap-1 ${
                      log.status === 'success'
                        ? 'bg-emerald-950 text-emerald-400'
                        : log.status === 'rejected'
                        ? 'bg-amber-950 text-amber-400'
                        : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {log.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                    {log.status === 'rejected' && <ShieldAlert className="w-3 h-3" />}
                    {log.status === 'failed' && <XCircle className="w-3 h-3" />}
                    {log.status}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleString('fa-IR')}
                </div>

                <pre className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300 overflow-x-auto">
                  {JSON.stringify(log.args, null, 2)}
                </pre>

                {log.result && (
                  <pre className="p-2 bg-slate-900/60 rounded font-mono text-[10px] text-slate-400 overflow-x-auto max-h-32">
                    {JSON.stringify(log.result, null, 2)}
                  </pre>
                )}

                {log.error && <div className="text-rose-400 text-[11px] font-mono">{log.error}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
