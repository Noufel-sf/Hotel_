import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore, ToastType } from '../store/useToastStore';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-white text-emerald-700',
  error: 'border-rose-200 bg-white text-rose-700',
  info: 'border-navy-200 bg-white text-navy-800',
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 w-[min(360px,90vw)]">
      {toasts.map((t) => {
        const Icon = ICONS[t.type] || Info;
        return (
          <div
            key={t.id}
            className={`animate-toast-in flex items-start gap-3 rounded-xl border shadow-pop px-4 py-3 ${STYLES[t.type] || STYLES.info}`}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-ink-300 hover:text-ink-700 transition-colors">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
