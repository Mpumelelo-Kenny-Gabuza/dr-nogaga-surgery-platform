import { createContext, useCallback, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import clsx from "clsx";

type Toast = { id: number; kind: "success" | "error"; message: string };
type ToastContextValue = { show: (kind: Toast["kind"], message: string) => void };

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/** Save-success/error feedback for every admin form — one place, not re-implemented per screen. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((kind: Toast["kind"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((toast) => toast.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              "pointer-events-auto flex items-center gap-2 rounded-sm border px-4 py-3 text-sm shadow-lg",
              toast.kind === "success"
                ? "border-teal/30 bg-white text-ink"
                : "border-red-300 bg-white text-red-700"
            )}
          >
            {toast.kind === "success" ? (
              <CheckCircle2 size={16} className="text-teal" />
            ) : (
              <XCircle size={16} className="text-red-600" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
