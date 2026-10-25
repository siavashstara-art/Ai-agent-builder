import { GoogleGenAI, Type } from '@google/genai';
import { getAllTools } from './toolsEngine.js';

const SYSTEM_INSTRUCTION_FA = `شما دستیار هوشمند و عامل خودکار «توانا» (TAVANA AI Agent) هستید.
نقش شما: معمار ارشد نرم‌افزار، مهندس هوش مصنوعی و توسعه‌دهندهٔ فول‌استک خودکار.

اصول و چارچوب پاسخگویی:
۱. همواره به زبان فارسی، محترمانه، دقیق و کاملاً مهندسی پاسخ دهید.
۲. شما دارای هستهٔ ابزارهای واقعی اجرایی (دسترسی به فایل‌های پروژه، اجرای فرمان، تست، کامپایل، گیت) هستید.
۳. در صورت دریافت درخواست‌های پیچیده یا چندمرحله‌ای، آن را به مراحل منطقی و روشن تقسیم کنید.
۴. برای عملیات‌های حساس یا مخرب، همواره تأیید صریح کاربر را در نظر داشته باشید.
۵. کدها را تمیز، بهینه، با رعایت تایپ اسکریپت و بدون داده‌های جعلی ارائه دهید.
۶. همیشه اطلاعات محرمانه (API Key) را محفوظ نگه دارید و هرگز آن‌ها را افشا نکنید.`;

export interface TaskStep {
  stepNumber: number;
  title: string;
  description: string;
  toolToUse?: string;
  toolArgs?: Record<string, any>;
  requiresApproval: boolean;
}

export interface TaskPlanResponse {
  goal: string;
  summary: string;
  steps: TaskStep[];
}

/**
 * Get Gemini API Client instance safely
 */
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('کلید GEMINI_API_KEY در متغیرهای محیطی یافت نشد.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Generate AI Chat Response
 */
export async function generateAgentChat(
  messages: Array<{ role: 'user' | 'model'; text: string }>,
  selectedModel: string = 'gemini-3.8-flash'
): Promise<{ text: string; modelUsed: string }> {
  try {
    const ai = getGeminiClient();
    const activeTools = getAllTools().map(t => ({
      name: t.name,
      nameFa: t.nameFa,
      description: t.description,
      permission: t.permission,
    }));

    const toolsPrompt = `ابزارهای فعلی فعال در سیستم:\n${JSON.stringify(activeTools, null, 2)}`;

    const contents = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: `${SYSTEM_INSTRUCTION_FA}\n\n${toolsPrompt}`,
        temperature: 0.7,
      },
    });

    const outputText = response.text || 'پاسخی از مدل دریافت نشد.';
    return { text: outputText, modelUsed: selectedModel };
  } catch (err: any) {
    console.error('AI Chat Error:', err);
    throw new Error(`خطا در ارتباط با مدل هوش مصنوعی: ${err.message}`);
  }
}

/**
 * Generate a Multi-Step Structured Task Plan
 */
export async function generateTaskPlan(
  goal: string,
  selectedModel: string = 'gemini-3.8-flash'
): Promise<TaskPlanResponse> {
  try {
    const ai = getGeminiClient();
    const availableTools = getAllTools().map(t => ({
      name: t.name,
      description: t.description,
      permission: t.permission,
    }));

    const prompt = `هدف اصلی کاربر: "${goal}"

لطفاً این هدف را به یک برنامهٔ اجرایی گام‌به‌گام (بین ۲ تا ۶ مرحله) تبدیل کنید.
ابزارهای در دسترس: ${JSON.stringify(availableTools, null, 2)}

مراحل باید بر اساس ابزارهای واقعی تعریف شوند. ابزارهای حساس (مانند run_command, write_file, github_commit) نیاز به تأیید کاربر (requiresApproval = true) دارند.
خروجی باید به فرمت JSON مطابق با Schema تعیین‌شده باشد.`;

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_FA,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            goal: { type: Type.STRING, description: 'هدف کارهای برنامه' },
            summary: { type: Type.STRING, description: 'خلاصه طرح اجرایی به فارسی' },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING, description: 'عنوان گام به فارسی' },
                  description: { type: Type.STRING, description: 'شرح عملکرد این گام' },
                  toolToUse: { type: Type.STRING, description: 'نام ابزار پیشنهادی' },
                  toolArgs: { type: Type.OBJECT, description: 'پارامترهای ابزار' },
                  requiresApproval: { type: Type.BOOLEAN, description: 'نیازمند تأیید کاربر' },
                },
                required: ['stepNumber', 'title', 'description', 'requiresApproval'],
              },
            },
          },
          required: ['goal', 'summary', 'steps'],
        },
      },
    });

    const rawJson = response.text?.trim() || '{}';
    const parsed: TaskPlanResponse = JSON.parse(rawJson);
    return parsed;
  } catch (err: any) {
    console.error('Task Plan Generation Error:', err);
    // Fallback structured response if AI parsing fails
    return {
      goal,
      summary: 'طرح اولیه دستیار توانا برای اجرای هدف کاربر',
      steps: [
        {
          stepNumber: 1,
          title: 'تحلیل اولیه و بررسی وضعیت فایل‌ها',
          description: 'بررسی فایل‌های ریشه و متغیرهای پروژه',
          toolToUse: 'list_files',
          toolArgs: { dirPath: '.' },
          requiresApproval: false,
        },
        {
          stepNumber: 2,
          title: 'سنجش صحت و سلامت کامپایل پروژه',
          description: 'اجرای تست کامپایل برای اطمینان از عدم وجود خطا',
          toolToUse: 'run_build',
          toolArgs: {},
          requiresApproval: false,
        },
      ],
    };
  }
}

/**
 * Generate Fix for Code based on Error
 */
export async function fixCodeFromError(
  filePath: string,
  currentCode: string,
  errorLog: string
): Promise<{ fixedCode: string; explanation: string }> {
  try {
    const ai = getGeminiClient();
    const prompt = `فایل: ${filePath}
خطای مشاهده شده:
${errorLog}

کد فعلی:
\`\`\`ts
${currentCode}
\`\`\`

لطفاً کد اصلاح‌شده و توضیحات دلیل اصلاح را به فرمت JSON ارائه دهید.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_FA,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fixedCode: { type: Type.STRING, description: 'کد اصلاح‌شده کامل' },
            explanation: { type: Type.STRING, description: 'توضیح دلایل اصلاح به فارسی' },
          },
          required: ['fixedCode', 'explanation'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return {
      fixedCode: parsed.fixedCode || currentCode,
      explanation: parsed.explanation || 'اصلاح بر اساس خطای سیستم انجام شد.',
    };
  } catch (err: any) {
    throw new Error(`خطا در اصلاح کد: ${err.message}`);
  }
}
