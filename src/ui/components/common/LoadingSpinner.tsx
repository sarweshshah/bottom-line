import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 size={24} className="animate-spin text-accent" />
      <p className="text-xs text-figma-text-secondary">{message}</p>
    </div>
  );
}
