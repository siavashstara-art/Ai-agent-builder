import React, { useState } from 'react';
import { TestTube2, CheckCircle2, XCircle, Play, ShieldAlert, Sparkles, Terminal } from 'lucide-react';
import { SystemTestReport } from '../types/agent';

interface TestDiagnosticsProps {
  testReport: SystemTestReport | null;
  onRunTestSuite: () => Promise<void>;
  isLoading: boolean;
}

export const TestDiagnostics: React.FC<TestDiagnosticsProps> = ({
  testReport,
  onRunTestSuite,
  isLoading,
}) => {
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Test Runner Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-lg">
            <TestTube2 className="w-5 h-5 text-cyan-400" />
            <span>آزمایشگاه و سنجش سلامت سیستم (System Diagnostics)</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            ارزیابی مستقیم و واقعی کارکرد زیرسیستم‌ها (فایل‌سیستم، امنیت فرمان، پشتبان‌گیری، مجوزها و کامپایل).
          </p>
        </div>

        <button
          onClick={onRunTestSuite}
          disabled={isLoading}
          className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 shrink-0 shadow-lg shadow-cyan-600/20"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>اجرای کلیهٔ آزمون‌ها</span>
        </button>
      </div>

      {/* Test Report View */}
      {testReport ? (
        <div className="space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
              <div className="text-xs text-slate-400">کل آزمون‌ها</div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{testReport.totalTests}</div>
            </div>

            <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-2xl">
              <div className="text-xs text-emerald-400 font-semibold">پذیرفته‌شده (Passed)</div>
              <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">{testReport.passCount}</div>
            </div>

            <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-2xl">
              <div className="text-xs text-rose-400 font-semibold">ناموفق (Failed)</div>
              <div className="text-2xl font-bold font-mono text-rose-300 mt-1">{testReport.failCount}</div>
            </div>

            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
              <div className="text-xs text-slate-400">وضعیت کلی</div>
              <div className={`text-sm font-bold mt-2 ${testReport.allPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                {testReport.allPassed ? '✓ کلیه آزمون‌ها موفق' : '✕ خطا در برخی آزمون‌ها'}
              </div>
            </div>
          </div>

          {/* Test Items Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-200">جزئیات نتایج آزمون‌های واقعی:</h3>

            <div className="space-y-2">
              {testReport.results.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                    item.passed
                      ? 'bg-slate-950/80 border-slate-800'
                      : 'bg-rose-950/20 border-rose-800/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {item.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{item.nameFa}</span>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1">{item.details}</p>
                      {item.error && <p className="text-rose-400 mt-1 font-mono text-[11px]">{item.error}</p>}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    زمان: {item.durationMs}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 text-slate-400 text-xs">
          برای سنجش کارکرد واقعی سیستم، دکمه «اجرای کلیهٔ آزمون‌ها» را فشار دهید.
        </div>
      )}
    </div>
  );
};
