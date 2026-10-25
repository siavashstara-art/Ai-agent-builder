/**
 * Command Sanitizer and Inspector for TAVANA AI Agent
 * Prevents system destruction or malicious command execution.
 */

const BLOCKED_COMMANDS = [
  'rm -rf /',
  'rm -rf /*',
  'rm -rf .',
  'mkfs',
  'dd if=',
  ':(){ :|:& };:', // fork bomb
  'shutdown',
  'reboot',
  'init 0',
  'init 6',
  'chmod -r 000',
  'chown -r',
  '> /dev/sda',
  'format',
];

const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+[\/\~]/i,
  /curl\s+.*\s*\|\s*sh/i,
  /wget\s+.*\s*\|\s*sh/i,
  /eval\(.*/i,
];

export interface ValidationResult {
  safe: boolean;
  reason?: string;
  sanitizedCommand: string;
}

/**
 * Validates a command string against blocked patterns and commands
 */
export function validateCommand(command: string): ValidationResult {
  const trimmed = command.trim();

  if (!trimmed) {
    return { safe: false, reason: 'فرمان خالی است.', sanitizedCommand: '' };
  }

  // Check exact blocked phrases
  for (const blocked of BLOCKED_COMMANDS) {
    if (trimmed.toLowerCase().includes(blocked.toLowerCase())) {
      return {
        safe: false,
        reason: `اجرای این فرمان به دلیل امنیتی مسدود شده است: (${blocked})`,
        sanitizedCommand: trimmed,
      };
    }
  }

  // Check blocked regex patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        safe: false,
        reason: 'الگوی ناامن در فرمان شناسایی شد.',
        sanitizedCommand: trimmed,
      };
    }
  }

  return {
    safe: true,
    sanitizedCommand: trimmed,
  };
}
