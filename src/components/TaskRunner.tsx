import React, { useState } from 'react';
import { ListChecks, Play, Pause, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, Terminal, ArrowLeft } from 'lucide-react';
import { TaskPlan, TaskStep } from '../types/agent';

interface TaskRunnerProps {
  currentPlan: TaskPlan | null;
  onGeneratePlan: (goal: string) => Promise<void>;
  onExecuteStep: (step: TaskStep, confirmed: boolean) => Promise<void>;
  isLoading: boolean;
  onRequestApproval: (title: string, description: string, onApprove: () => void) => void;
}

export const TaskRunner: React.FC<TaskRunnerProps> = ({
  currentPlan,
  onGeneratePlan,
  onExecuteStep,
  isLoading,
  onRequestApproval,
}) => {
  const [goalInput, setGoalInput] = useState('');
  const [isAutoRunning, setIsAutoRunning] = useState(false);

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim() || isLoading) return;
    onGeneratePlan(goalInput);
  };

  const sampleGoals = [
    'توسعه سیستم بکاپ‌گیری خودکار از فایل‌های حساس پیش از تغییر',
    'اجرای آزمون کامپایل پروژه و بررسی کدهای تایپ‌اسکریپت',
    'ایجاد قالب ربات تلگرام در پوشه خروجی‌ها (exports)',
    'تحلیل فایل‌های پروژه و ایجاد کامیت جدید در Git',
  ];

  const handleStepAction = (step: TaskStep) => {
    if (step.requiresApproval) {
      onRequestApproval(
        `تأیید اجرای گام ${step.stepNumber}: ${step.title}`,
        `این گام نیازمند دسترسی حساس است. ابزار: ${step.toolToUse || 'مشخص‌نشده'} | پارامترها: ${JSON.stringify(step.toolArgs || {})}`,
        () => onExecuteStep(step, true)
      );
    } else {
      onExecuteStep(step, false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Goal Input Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-2.5 mb-3 text-cyan-400 font-bold text-base">
          <ListChecks className="w-5 h-5 text-cyan-400" />
          <span>برنامه‌ریزی و مدیریت وظایف چندمرحله‌ای</span>
        </div>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          هدف یا وظیفهٔ اصلی مورد نظر خود را توصیف کنید. عامل توانا آن را به مراحل اجرایی با ابزارهای واقعی تبدیل می‌کند.
        </p>

        <form onSubmit={handleCreatePlan} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="مثال: ساخت یک برنامه وب کوچک با سیستم ذخیره در فایل..."
              className="flex-1 bg-slate-950 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 border border-slate-800 focus:border-cyan-500 outline-none text-sm"
            />
            <button
              type="submit"
              disabled={!goalInput.trim() || isLoading}
              className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl transition flex items-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>ایجاد طرح اجرایی</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-[11px] text-slate-500 py-1">پیشنهادها:</span>
            {sampleGoals.map((g, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setGoalInput(g)}
                className="text-[11px] bg-slate-950 text-slate-400 hover:text-cyan-300 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-cyan-800/50 transition"
              >
                {g}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Plan Display Card */}
      {currentPlan && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="text-xs text-slate-400">هدف فعلی:</div>
              <h3 className="text-base font-bold text-slate-100">{currentPlan.goal}</h3>
              <p className="text-xs text-cyan-400/90 mt-0.5">{currentPlan.summary}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                {currentPlan.steps.filter(s => s.status === 'completed').length} / {currentPlan.steps.length} گام
              </span>
            </div>
          </div>

          {/* Steps Timeline */}
          <div className="space-y-3">
            {currentPlan.steps.map((step) => {
              const isCompleted = step.status === 'completed';
              const isRunning = step.status === 'running';
              const isFailed = step.status === 'failed';
              const isRequiresApproval = step.requiresApproval && step.status !== 'completed';

              return (
                <div
                  key={step.stepNumber}
                  className={`p-4 rounded-xl border transition ${
                    isCompleted
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : isRunning
                      ? 'bg-cyan-950/30 border-cyan-500/50'
                      : isFailed
                      ? 'bg-rose-950/20 border-rose-800/40'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isRunning
                            ? 'bg-cyan-600 text-white animate-pulse'
                            : isFailed
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {step.stepNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-slate-200">{step.title}</h4>
                          {step.requiresApproval && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/50 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              نیازمند تأیید کاربر
                            </span>
                          )}
                          {step.toolToUse && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-cyan-300">
                              ابزار: {step.toolToUse}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{step.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStepAction(step)}
                      disabled={isLoading || isCompleted || isRunning}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                        isCompleted
                          ? 'bg-emerald-950 text-emerald-400 cursor-default'
                          : isRequiresApproval
                          ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تکمیل شد</span>
                        </>
                      ) : isRunning ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>در حال اجرا...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>{step.requiresApproval ? 'تأیید و اجرای گام' : 'اجرای گام'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {step.result && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 font-mono text-[11px]">
                      <div className="text-slate-400 mb-1 flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-cyan-400" />
                        <span>خروجی اجرا:</span>
                      </div>
                      <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-300 overflow-x-auto max-h-40">
                        {typeof step.result === 'string' ? step.result : JSON.stringify(step.result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {step.error && (
                    <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-800/50">
                      خطا: {step.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
