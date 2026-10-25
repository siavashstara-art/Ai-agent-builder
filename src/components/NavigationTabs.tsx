import React from 'react';
import { MessageSquare, ListChecks, Wrench, FolderTree, TestTube2, Download } from 'lucide-react';

export type TabType = 'chat' | 'tasks' | 'tools' | 'files' | 'tests' | 'export';

interface NavigationTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  pendingApprovalsCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
}) => {
  const tabs = [
    { id: 'chat', label: 'چت و دستیار هوشمند', icon: MessageSquare },
    { id: 'tasks', label: 'برنامه‌ریزی و اجرای وظایف', icon: ListChecks },
    { id: 'tools', label: 'مرکز ابزارهای اجرایی', icon: Wrench, badge: '۹ ابزار' },
    { id: 'files', label: 'مدیریت فایل پروژه', icon: FolderTree },
    { id: 'tests', label: 'آزمایشگاه و تست سیستم', icon: TestTube2 },
    { id: 'export', label: 'تولید خروجی و ساخت', icon: Download },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/60 px-4 lg:px-8 py-2 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto flex items-center gap-1 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                  {tab.badge}
                </span>
              )}
              {tab.id === 'tasks' && pendingApprovalsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
