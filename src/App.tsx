import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { NavigationTabs, TabType } from './components/NavigationTabs';
import { ChatInterface } from './components/ChatInterface';
import { TaskRunner } from './components/TaskRunner';
import { ToolsCenter } from './components/ToolsCenter';
import { FileManager } from './components/FileManager';
import { TestDiagnostics } from './components/TestDiagnostics';
import { AppExporter } from './components/AppExporter';
import { ApprovalModal } from './components/ApprovalModal';
import { ActivityLogsDrawer } from './components/ActivityLogsDrawer';
import {
  SystemStatus,
  ToolItem,
  ToolLog,
  ChatMessage,
  TaskPlan,
  TaskStep,
  SystemTestReport,
  BackupRecord,
} from './types/agent';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [logs, setLogs] = useState<ToolLog[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPlan, setCurrentPlan] = useState<TaskPlan | null>(null);
  const [testReport, setTestReport] = useState<SystemTestReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);

  // Modal approval state
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onApprove?: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  // Fetch initial system status, tools, logs, backups
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/agent/status');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error('Failed to fetch status', err);
    }
  };

  const fetchTools = async () => {
    try {
      const res = await fetch('/api/agent/tools');
      const data = await res.json();
      if (data.success && data.tools) setTools(data.tools);
    } catch (err) {
      console.error('Failed to fetch tools', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/agent/logs');
      const data = await res.json();
      if (data.success && data.logs) setLogs(data.logs);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/agent/backups');
      const data = await res.json();
      if (data.success && data.backups) setBackups(data.backups);
    } catch (err) {
      console.error('Failed to fetch backups', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchTools();
    fetchLogs();
    fetchBackups();
  }, []);

  // Request Approval Helper
  const handleRequestApproval = (title: string, description: string, onApprove: () => void) => {
    setApprovalModal({
      isOpen: true,
      title,
      description,
      onApprove: () => {
        setApprovalModal((prev) => ({ ...prev, isOpen: false }));
        onApprove();
      },
    });
  };

  // Chat Handler
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_usr`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, selectedModel }),
      });

      const data = await res.json();

      if (data.success) {
        const botMsg: ChatMessage = {
          id: `msg_${Date.now()}_bot`,
          role: 'model',
          text: data.response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `msg_${Date.now()}_err`,
          role: 'model',
          text: `خطا در برقراری ارتباط: ${data.error || 'پاسخی دریافت نشد.'}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'model',
        text: `خطا در شبکه یا سرور: ${err.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      fetchLogs();
    }
  };

  // Task Planner Handler
  const handleGeneratePlan = async (goal: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/task/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, selectedModel }),
      });
      const data = await res.json();
      if (data.success && data.plan) {
        setCurrentPlan(data.plan);
      }
    } catch (err) {
      console.error('Failed to generate task plan', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Step Execution Handler
  const handleExecuteStep = async (step: TaskStep, confirmed: boolean) => {
    if (!currentPlan) return;

    // Update step status to running
    setCurrentPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        steps: prev.steps.map((s) => (s.stepNumber === step.stepNumber ? { ...s, status: 'running' } : s)),
      };
    });

    setIsLoading(true);

    try {
      if (step.toolToUse) {
        const res = await fetch('/api/agent/tools/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolName: step.toolToUse,
            args: step.toolArgs || {},
            userConfirmed: confirmed,
          }),
        });

        const data = await res.json();

        setCurrentPlan((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            steps: prev.steps.map((s) =>
              s.stepNumber === step.stepNumber
                ? {
                    ...s,
                    status: data.success ? 'completed' : 'failed',
                    result: data.result,
                    error: data.error,
                  }
                : s
            ),
          };
        });
      } else {
        // Simple step complete
        setCurrentPlan((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            steps: prev.steps.map((s) =>
              s.stepNumber === step.stepNumber ? { ...s, status: 'completed', result: 'گام بدون ابزار اجرا گردید.' } : s
            ),
          };
        });
      }
    } catch (err: any) {
      setCurrentPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map((s) =>
            s.stepNumber === step.stepNumber ? { ...s, status: 'failed', error: err.message } : s
          ),
        };
      });
    } finally {
      setIsLoading(false);
      fetchLogs();
      fetchBackups();
    }
  };

  // Execute Tool Direct Handler
  const handleExecuteToolDirect = async (toolName: string, args: any, confirmed: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, args, userConfirmed: confirmed }),
      });
      const data = await res.json();
      fetchLogs();
      fetchBackups();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  // File Manager Helpers
  const handleReadFile = async (filePath: string) => {
    return handleExecuteToolDirect('read_file', { filePath }, true);
  };

  const handleWriteFile = async (filePath: string, content: string) => {
    return handleExecuteToolDirect('write_file', { filePath, content }, true);
  };

  const handleListFiles = async (dirPath: string) => {
    return handleExecuteToolDirect('list_files', { dirPath }, true);
  };

  // Run Test Suite Handler
  const handleRunTestSuite = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/tests', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.report) {
        setTestReport(data.report);
      }
    } catch (err) {
      console.error('Test Suite Error', err);
    } finally {
      setIsLoading(false);
      fetchLogs();
    }
  };

  // Restore Backup Handler
  const handleRestoreBackup = async (backupId: string) => {
    handleRequestApproval(
      'بازیابی فایل از نسخهٔ پشتیبان',
      `آیا از بازیابی این فایل اطمینان دارید؟ محتوای فعلی با نسخهٔ پشتیبان جایگزین خواهد شد.`,
      async () => {
        setIsLoading(true);
        try {
          const res = await fetch('/api/agent/backups/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backupId }),
          });
          const data = await res.json();
          alert(data.message || (data.success ? 'با موفقیت بازیابی شد.' : 'خطا در بازیابی.'));
          fetchBackups();
        } catch (err: any) {
          alert('خطا در بازیابی: ' + err.message);
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Top Header */}
      <Header
        status={status}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        onOpenLogs={() => setIsLogsOpen(true)}
      />

      {/* Main Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={
          currentPlan?.steps.filter((s) => s.requiresApproval && s.status !== 'completed').length || 0
        }
      />

      {/* View Content Body */}
      <main className="flex-1 py-4">
        {activeTab === 'chat' && (
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            selectedModel={selectedModel}
            onExecuteToolDirect={(name, args) => handleExecuteToolDirect(name, args, true)}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskRunner
            currentPlan={currentPlan}
            onGeneratePlan={handleGeneratePlan}
            onExecuteStep={handleExecuteStep}
            isLoading={isLoading}
            onRequestApproval={handleRequestApproval}
          />
        )}

        {activeTab === 'tools' && (
          <ToolsCenter
            tools={tools}
            logs={logs}
            onExecuteTool={handleExecuteToolDirect}
            isLoading={isLoading}
            onRequestApproval={handleRequestApproval}
          />
        )}

        {activeTab === 'files' && (
          <FileManager
            onReadFile={handleReadFile}
            onWriteFile={handleWriteFile}
            onListFiles={handleListFiles}
            backups={backups}
            onRestoreBackup={handleRestoreBackup}
            onRequestApproval={handleRequestApproval}
          />
        )}

        {activeTab === 'tests' && (
          <TestDiagnostics
            testReport={testReport}
            onRunTestSuite={handleRunTestSuite}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'export' && (
          <AppExporter
            onExecuteTool={(name, args) => handleExecuteToolDirect(name, args, true)}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Human In The Loop Approval Modal */}
      <ApprovalModal
        isOpen={approvalModal.isOpen}
        title={approvalModal.title}
        description={approvalModal.description}
        onApprove={() => approvalModal.onApprove?.()}
        onReject={() => setApprovalModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Audit Activity Logs Drawer */}
      <ActivityLogsDrawer
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        logs={logs}
        onRefreshLogs={fetchLogs}
      />
    </div>
  );
}
