export interface SystemStatus {
  appName: string;
  version: string;
  status: string;
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    cwd: string;
    hasGeminiApiKey: boolean;
  };
  capabilities: Array<{
    key: string;
    label: string;
    active: boolean;
  }>;
  timestamp: string;
}

export interface ToolItem {
  name: string;
  nameFa: string;
  description: string;
  permission: 'automatic' | 'user_approval';
  parametersSchema: Record<string, any>;
}

export interface ToolLog {
  id: string;
  toolName: string;
  args: any;
  result?: any;
  error?: string;
  timestamp: string;
  permissionUsed: 'automatic' | 'user_approval';
  status: 'success' | 'failed' | 'rejected';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  toolCall?: {
    toolName: string;
    args: any;
    result?: any;
    status: 'pending' | 'success' | 'failed' | 'requires_approval';
  };
}

export interface TaskStep {
  stepNumber: number;
  title: string;
  description: string;
  toolToUse?: string;
  toolArgs?: Record<string, any>;
  requiresApproval: boolean;
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'requires_approval' | 'paused';
  result?: any;
  error?: string;
}

export interface TaskPlan {
  goal: string;
  summary: string;
  steps: TaskStep[];
}

export interface TestResultItem {
  id: string;
  nameFa: string;
  category: string;
  passed: boolean;
  durationMs: number;
  details: string;
  error?: string;
}

export interface SystemTestReport {
  timestamp: string;
  totalTests: number;
  passCount: number;
  failCount: number;
  allPassed: boolean;
  results: TestResultItem[];
}

export interface BackupRecord {
  id: string;
  originalPath: string;
  backupPath: string;
  timestamp: string;
  size: number;
}
