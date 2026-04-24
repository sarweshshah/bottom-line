import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-center gap-1.5 text-xs text-danger bg-danger-bg border border-danger-border rounded-md px-2.5 py-1.5"
      role="alert"
    >
      <AlertCircle size={12} aria-hidden />
      {children}
    </div>
  );
}
