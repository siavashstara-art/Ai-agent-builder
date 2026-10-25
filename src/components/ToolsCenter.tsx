import React, { useState } from 'react';
import { Wrench, ShieldCheck, ShieldAlert, Play, Terminal, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ToolItem, ToolLog } from '../types/agent';

interface ToolsCenterProps {
  tools: ToolItem[];
  logs: ToolLog[];
  onExecuteTool: (toolName: string, args: any, confirmed?: boolean) => Promise<any>;
  isLoading: boolean;
  onRequestApproval: (title: string, description: string, onApprove: () => void) => void;
}

export const ToolsCenter: React.FC<ToolsCenterProps> = ({
  tools,
  logs,
  onExecuteTool,
  isLoading,
  onRequestApproval,
}) => {
  const [selectedTool, setSelectedTool] = useState<string>(tools[0]?.name || 'read_file');
  const [argsJson, setArgsJson] = useState<string>('{\n  "filePath": "package.json"\n}');
  const [lastOutput, setLastOutput] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const activeToolDef = tools.find(t => t.name === selectedTool);

  const handleSelectTool = (tool: ToolItem) => {
    setSelectedTool(tool.name);
    if (tool.name === 'read_file') {
      setArgsJson('{\n  "filePath": "package.json"\n}');
    } else if (tool.name === 'write_file') {
      setArgsJson('{\n  "filePath": "src/test_output.txt",\n  "content": "سلام از مرکز ابزار توانا"\n}');
    } else if (tool.name === 'list_files') {
      setArgsJson('{\n  "dirPath": "."\n}');
    } else if (tool.name === 'run_command') {
      setArgsJson('{\n  "command": "node -v"\n}');
    } else if (tool.name === 'github_commit') {
      setArgsJson('{\n  "message": "Update by Tavana AI Agent"\n}');
    } else if (tool.name === 'app_exporter') {
      setArgsJson('{\n  "targetType": "telegram_bot",\n  "appName": "my_first_bot"\n}');
    } else {
      setArgsJson('{}');
    }
  };

  const handleRunTestBench = async () => {
    setExecuting(true);
    setLastOutput(null);
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(argsJson);
      } catch (e) {
        setLastOutput({ error: 'فرمت JSON پارامترها نامعتبر است.' });
        setExecuting(false);
        return;
      }

      if (activeToolDef?.permission === 'user_approval') {
        onRequestApproval(
          `تأیید اجرای ابزار: ${activeToolDef.nameFa}`,
          `ابزار ${activeToolDef.name} نیاز به تأیید کاربر دارد. پارامترها: ${argsJson}`,
          async () => {
            const res = await onExecuteTool(selectedTool, parsedArgs, true);
            setLastOutput(res);
            setExecuting(false);
          }
        );
        setExecuting(false);
      } else {
        const res = await onExecuteTool(selectedTool, parsedArgs, false);
        setLastOutput(res);
        setExecuting(false);
      }
    } catch (err: any) {
      setLastOutput({ error: err.message });
      setExecuting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Title Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-lg">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <span>مرکز ابزارهای اجرایی هسته (Tools Engine)</span>
          </div>
          <span className="text-xs px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 font-mono border border-cyan-800/50">
            {tools.length} ابزار فعال
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          تمامی ابزارهای این بخش واقعی و متصل به فایل‌سیستم، فرآیندها و سیستم کامپایل پروژه‌اند. هیچ ابزار دکوری یا تابع خالی در سیستم وجود ندارد.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tools List Grid */}
        <div className="lg:col-span-5 space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 px-1">فهرست ابزارهای پیاده‌سازی‌شده:</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {tools.map((tool) => {
              const isSelected = selectedTool === tool.name;
              const isApproval = tool.permission === 'user_approval';
              return (
                <button
                  key={tool.name}
                  onClick={() => handleSelectTool(tool)}
                  className={`w-full text-right p-3.5 rounded-xl border transition flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-slate-100 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{tool.nameFa}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {tool.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{tool.description}</p>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded shrink-0 flex items-center gap-1 font-medium ${
                      isApproval
                        ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                        : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                    }`}
                  >
                    {isApproval ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    {isApproval ? 'با تأیید' : 'خودکار'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workbench Tester */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          {activeToolDef ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs text-slate-400">میزکار تست مستقیم ابزار:</span>
                  <h3 className="text-base font-bold text-slate-100">{activeToolDef.nameFa} ({activeToolDef.name})</h3>
                </div>
                <button
                  onClick={handleRunTestBench}
                  disabled={executing || isLoading}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2"
                >
                  {executing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>تست و اجرای ابزار</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  ورودی‌ها (فرمت JSON):
                </label>
                <textarea
                  value={argsJson}
                  onChange={(e) => setArgsJson(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 font-mono text-xs text-cyan-300 p-3 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">
                  خروجی واقعی اجرا:
                </span>
                <pre className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-slate-300 min-h-[160px] max-h-[250px] overflow-auto border border-slate-800">
                  {lastOutput ? JSON.stringify(lastOutput, null, 2) : '// برای مشاهده خروجی واقعی، دکمه «تست و اجرای ابزار» را بفشارید.'}
                </pre>
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-xs text-center py-12">لطفاً یک ابزار انتخاب کنید.</div>
          )}
        </div>
      </div>
    </div>
  );
};
