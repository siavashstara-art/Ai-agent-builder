import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Terminal, Code2, AlertTriangle, CheckCircle2, Play } from 'lucide-react';
import { ChatMessage } from '../types/agent';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  selectedModel: string;
  onExecuteToolDirect: (toolName: string, args: any) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  selectedModel,
  onExecuteToolDirect,
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const quickPrompts = [
    'سلام توانا! ساختار فایل‌های پروژه را فهرست‌گیری و تحلیل کن.',
    'وضعیت کامپایل پروژه و صحت تایپ اسکریپت را بررسی کن.',
    'یک برنامهٔ چندمرحله‌ای برای توسعهٔ نرم‌افزار ایجاد کن.',
    'بررسی وضعیت Git و کامیت‌های اخیر پروژه را انجام بده.',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-145px)] max-w-5xl mx-auto p-4">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pl-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 mb-4 shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">به عامل هوشمند «توانا» خوش آمدید</h2>
            <p className="text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
              هستهٔ اصلی دستیار خودکار برای برنامه‌نویسی، ساخت فایل، اجرای فرمان، کامپایل کد و مدیریت وظایف چندمرحله‌ای به زبان فارسی.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full max-w-2xl text-right">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="p-3 text-xs font-medium bg-slate-900 hover:bg-slate-800/80 text-slate-300 hover:text-cyan-300 rounded-xl border border-slate-800 hover:border-cyan-800/60 transition text-right flex items-center gap-2 group"
                >
                  <Play className="w-3.5 h-3.5 text-cyan-500 opacity-60 group-hover:opacity-100 shrink-0" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isUser
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-cyan-400 border border-slate-700'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-cyan-600/20 text-cyan-50 border border-cyan-500/30 rounded-tl-none'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tr-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-slate-800/60 text-[11px] text-slate-400">
                    <span className="font-semibold">{isUser ? 'شما' : 'دستیار توانا (Tavana AI)'}</span>
                    <span className="font-mono text-[10px]">
                      {new Date(msg.timestamp).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                  {msg.toolCall && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          فراخوانی ابزار: {msg.toolCall.toolName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                          {msg.toolCall.status}
                        </span>
                      </div>
                      <pre className="font-mono text-[11px] bg-slate-900 p-2 rounded text-slate-300 overflow-x-auto">
                        {JSON.stringify(msg.toolCall.args, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 max-w-xs">
            <div className="w-4 h-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            <span>توانا در حال پردازش و استدلال است...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="mt-3 relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="پیام یا دستور خود را بنویسید (مثلاً: پروژه را کامپایل کن و وضعیت خطاها را بگو)..."
            disabled={isLoading}
            className="w-full bg-slate-900 text-slate-100 placeholder-slate-500 rounded-2xl py-3.5 pr-4 pl-12 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute left-2.5 p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl transition shadow-md shadow-cyan-600/20"
          >
            <Send className="w-4 h-4 transform rotate-180" />
          </button>
        </div>
      </form>
    </div>
  );
};
