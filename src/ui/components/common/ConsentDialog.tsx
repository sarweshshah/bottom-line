import { useState, useEffect, useCallback, useRef } from "react";
import { ShieldAlert, X } from "lucide-react";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalNoticePanel,
  ModalTitle,
} from "@ui/components/common/overlays";
import { BodyText } from "@ui/components/common/typography";
import { Button, IconButton } from "@ui/components/common/uiPrimitives";
import { useAIStore } from "@ui/store/aiStore";
import { getProviderDisplayName } from "@ui/ai/providerOptions";

export function ConsentDialog() {
  const [visible, setVisible] = useState(false);
  const provider = useAIStore((s) => s.provider);
  const imageAnalysisEnabled = useAIStore((s) => s.imageAnalysisEnabled);
  const setCloudAiConsented = useAIStore((s) => s.setCloudAiConsented);
  const pendingActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    function handleShow(e: Event) {
      const detail = (e as CustomEvent<{ onConsent?: () => void }>).detail;
      pendingActionRef.current = detail?.onConsent ?? null;
      setVisible(true);
    }
    window.addEventListener("show-ai-consent", handleShow);
    return () => window.removeEventListener("show-ai-consent", handleShow);
  }, []);

  const handleAccept = useCallback(() => {
    setCloudAiConsented(true, imageAnalysisEnabled);
    setVisible(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  }, [imageAnalysisEnabled, setCloudAiConsented]);

  const handleCancel = useCallback(() => {
    pendingActionRef.current = null;
    setVisible(false);
  }, []);

  if (!visible) return null;

  const providerName = getProviderDisplayName(provider, "consent");

  return (
    <Modal onBackdropClick={handleCancel}>
      <ModalHeader>
        <ModalTitle icon={ShieldAlert} iconClassName="text-warning">
          Cloud AI Consent
        </ModalTitle>
        <IconButton variant="default" onClick={handleCancel} aria-label="Close">
          <X size={13} />
        </IconButton>
      </ModalHeader>

      <ModalBody>
        <BodyText className="leading-relaxed">
          To generate AI summaries, comment text from your Figma threads will
          be sent to <strong className="text-figma-text">{providerName}</strong>.
        </BodyText>

        {imageAnalysisEnabled && (
          <BodyText className="leading-relaxed">
            With image analysis enabled, images from comment threads will also
            be sent to the AI provider for visual context.
          </BodyText>
        )}

        <ModalNoticePanel>
          Your Figma token and personal data are{" "}
          <strong className="text-figma-text-secondary">never</strong> sent to AI
          providers. Only the comment text
          {imageAnalysisEnabled ? " and images" : ""} within a single thread are
          transmitted per request.
        </ModalNoticePanel>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleAccept}>
          I understand, continue
        </Button>
      </ModalFooter>
    </Modal>
  );
}
