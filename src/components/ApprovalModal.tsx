import React from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onApprove: () => void;
  onReject: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  title,
  description,
  onApprove,
  onReject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-right">
        <div className="flex items-center gap-3 text-amber-400 font-bold text-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/60 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-slate-100 text-base">{title}</h3>
            <span className="text-[11px] text-amber-400 font-normal">نیازمند تأیید صریح کاربر (Human-in-the-Loop)</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onReject}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>انصراف و لغو</span>
          </button>
          <button
            onClick={onApprove}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition shadow-lg shadow-amber-400/20 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>تأیید و اجرای عملیات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
