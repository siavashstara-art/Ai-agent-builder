import React, { useState } from 'react';
import { Download, Bot, Smartphone, Gamepad2, Globe, CheckCircle2, FolderCheck } from 'lucide-react';

interface AppExporterProps {
  onExecuteTool: (toolName: string, args: any) => Promise<any>;
  isLoading: boolean;
}

export const AppExporter: React.FC<AppExporterProps> = ({
  onExecuteTool,
  isLoading,
}) => {
  const [targetType, setTargetType] = useState<'telegram_bot' | 'android_pwa' | 'mini_game' | 'web_app'>('telegram_bot');
  const [appName, setAppName] = useState('tavana_bot');
  const [exportResult, setExportResult] = useState<any>(null);

  const targets = [
    { id: 'telegram_bot', name: 'ربات تلگرام', icon: Bot, desc: 'کد آمادهٔ پایتون/نودجی‌اس با Telegraf و مدیریت وب‌هوک' },
    { id: 'android_pwa', name: 'برنامهٔ اندروید (PWA)', icon: Smartphone, desc: 'تنظیمات Web App Manifest و ServiceWorker جهت نصب مستقیم روی گوشی' },
    { id: 'mini_game', name: 'مینی‌گیم وب', icon: Gamepad2, desc: 'قالب بازی دوبعدی Canvas آمادهٔ توسعه' },
    { id: 'web_app', name: 'وب‌اپلیکیشن مستقل', icon: Globe, desc: 'باندل آمادهٔ انتشار ری‌اکت و سرور Express' },
  ];

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportResult(null);
    const res = await onExecuteTool('app_exporter', {
      targetType,
      appName: appName.replace(/[^a-zA-Z0-9_]/g, '_'),
    });
    setExportResult(res);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Title */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-lg mb-1">
          <Download className="w-5 h-5 text-cyan-400" />
          <span>تولید خروجی و آماده‌سازی ساختارهای جانبی</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          عامل توانا کدهای پروژه را آماده کرده و قالب‌های مورد نیاز شما را در پوشهٔ <code className="text-cyan-300 font-mono">exports/</code> ایجاد می‌کند.
        </p>
      </div>

      <form onSubmit={handleExport} className="space-y-6">
        {/* Targets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {targets.map((item) => {
            const Icon = item.icon;
            const isSelected = targetType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTargetType(item.id as any)}
                className={`text-right p-4 rounded-2xl border transition flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 text-slate-100 shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm mb-1">{item.name}</div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Input Configuration */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              نام انگلیسی پروژهٔ خروجی:
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full max-w-md bg-slate-950 text-slate-100 font-mono text-sm px-4 py-2.5 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none"
              placeholder="مثال: my_app_project"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
          >
            <Download className="w-4 h-4" />
            <span>تولید و ذخیرهٔ فایل‌های خروجی</span>
          </button>
        </div>
      </form>

      {/* Export Result Card */}
      {exportResult && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <FolderCheck className="w-5 h-5 text-emerald-400" />
            <span>خروجی با موفقیت تولید گردید!</span>
          </div>

          <pre className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-cyan-300 overflow-x-auto border border-slate-800">
            {JSON.stringify(exportResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
