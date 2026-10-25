import React from 'react';
import { Cpu, Terminal, Shield, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { SystemStatus } from '../types/agent';

interface HeaderProps {
  status: SystemStatus | null;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  onOpenLogs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  selectedModel,
  setSelectedModel,
  onOpenLogs,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 font-bold text-lg">
            ت
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-100 tracking-tight">TAVANA AI Agent</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                هسته V1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">دستیار هوشمند و عامل توسعهٔ خودکار نرم‌افزار</p>
          </div>
        </div>

        {/* Zone 2: Model Switcher & Status Indicators */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">مدل هوش مصنوعی:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-900 text-cyan-300 font-mono text-xs px-2.5 py-1 rounded border border-slate-700 outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (سریع & بهینه)</option>
              <option value="gemini-4-argon">Gemini 4 Argon (استدلال پیشرفته)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">محیط:</span>
            <span className="font-mono text-slate-200">{status?.environment?.nodeVersion || 'Node.js'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/50 text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>هسته فعال</span>
          </div>
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenLogs}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700 hover:border-slate-600"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>گزارش عملکرد</span>
          </button>
        </div>
      </div>
    </header>
  );
};
