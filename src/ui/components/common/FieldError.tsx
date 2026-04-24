import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-start gap-2 rounded-md border border-danger-border bg-danger-bg px-2.5 py-2 text-xs text-danger"
      role="alert"
    >
      <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
      <span className="leading-5">{children}</span>
    </div>
  );
}
