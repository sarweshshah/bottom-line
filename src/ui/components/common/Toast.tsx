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

  if (toasts.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 flex flex-col z-50">
      {toasts.map((toast) => (
        <ToastBar
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function ToastBar({
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
    <div className="flex items-center gap-2 px-3 py-2.5 bg-indigo-600 text-white border-t border-indigo-500 text-xs animate-in slide-in-from-bottom">
      <Icon size={13} className="shrink-0 opacity-80" />
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  );
}
