import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

type Tone = 'success' | 'info' | 'error';
interface Toast { id: number; message: string; tone: Tone }

const ToastCtx = createContext<(message: string, tone?: Tone) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={notify}>
      {children}
      <div className="no-print fixed bottom-4 right-4 z-[60] flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex animate-fadeUp items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-card"
          >
            {t.tone === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            {t.tone === 'info' && <Info className="h-4 w-4 text-cyan-500" />}
            {t.tone === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
