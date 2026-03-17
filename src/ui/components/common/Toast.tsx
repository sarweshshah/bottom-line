import { useEffect, useState, useCallback, useRef } from "react";
import { X, AlertCircle, CheckCircle2, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

let addToastFn: ((message: string, type?: ToastType) => void) | null = null;

export function showToast(message: string, type: ToastType = "info") {
  addToastFn?.(message, type);
}

const icons: Record<ToastType, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: "border-green-500/30 bg-green-500/10 text-green-500",
  error: "border-danger-border bg-danger-bg text-danger",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-500",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const counter = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `toast_${++counter.current}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  return (
    <div className="fixed bottom-3 left-3 right-3 flex flex-col gap-2 z-50 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon = icons[toast.type];
  return (
    <div
      className={`pointer-events-auto flex items-center gap-2 px-3 py-2.5 rounded-lg border shadow-sm text-xs animate-in slide-in-from-bottom ${styles[toast.type]}`}
    >
      <Icon size={14} className="shrink-0" />
      <span className="flex-1 mt-px">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100"
      >
        <X size={12} />
      </button>
    </div>
  );
}
