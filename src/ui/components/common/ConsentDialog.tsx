import { useState, useEffect, useCallback } from "react";
import { ShieldAlert, X } from "lucide-react";
import { useAIStore } from "@ui/store/aiStore";
import { PROVIDER_MODEL_LABELS } from "@ui/ai/cloudProvider";

export function ConsentDialog() {
  const [visible, setVisible] = useState(false);
  const provider = useAIStore((s) => s.provider);
  const imageAnalysisEnabled = useAIStore((s) => s.imageAnalysisEnabled);
  const setCloudAiConsented = useAIStore((s) => s.setCloudAiConsented);

  useEffect(() => {
    function handleShow() {
      setVisible(true);
    }
    window.addEventListener("show-ai-consent", handleShow);
    return () => window.removeEventListener("show-ai-consent", handleShow);
  }, []);

  const handleAccept = useCallback(() => {
    setCloudAiConsented(true, imageAnalysisEnabled);
    setVisible(false);
  }, [imageAnalysisEnabled, setCloudAiConsented]);

  const handleCancel = useCallback(() => {
    setVisible(false);
  }, []);

  if (!visible) return null;

  const providerName = provider === "custom"
    ? "your custom endpoint"
    : PROVIDER_MODEL_LABELS[provider] ?? provider;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-figma-bg rounded-lg shadow-xl w-[340px] max-w-[90vw] border border-figma-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-figma-border">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-warning" />
            <span className="text-sm font-medium text-figma-text">
              Cloud AI Consent
            </span>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="p-1 rounded-md text-figma-icon-tertiary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-3">
          <p className="text-xs text-figma-text-secondary leading-relaxed">
            To generate AI summaries, comment text from your Figma threads will
            be sent to <strong>{providerName}</strong>.
          </p>

          {imageAnalysisEnabled && (
            <p className="text-xs text-figma-text-secondary leading-relaxed">
              With image analysis enabled, images from comment threads will also
              be sent to the AI provider for visual context.
            </p>
          )}

          <div className="p-2.5 bg-figma-bg-secondary rounded-md">
            <p className="text-[11px] text-figma-text-tertiary leading-relaxed">
              Your Figma token and personal data are <strong>never</strong> sent
              to AI providers. Only the comment text
              {imageAnalysisEnabled ? " and images" : ""} within a single thread
              are transmitted per request.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-figma-border">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-figma-bg-secondary text-figma-text-secondary hover:bg-figma-bg-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent-bg text-white hover:bg-accent-hover transition-colors"
          >
            I understand, continue
          </button>
        </div>
      </div>
    </div>
  );
}
