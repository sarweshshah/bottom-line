import { useCallback } from "react";
import { useAuthStore } from "@ui/store/authStore";
import { useFigmaFileUrlInput } from "@ui/hooks/useFigmaFileUrlInput";

export function useLinkFileStep() {
  const user = useAuthStore((s) => s.user);
  const setFileInfo = useAuthStore((s) => s.setFileInfo);
  const completeSetup = useAuthStore((s) => s.completeSetup);
  const isValidating = useAuthStore((s) => s.isValidating);
  const fileUrlInput = useFigmaFileUrlInput();

  const handleSubmit = useCallback(async () => {
    if (!user || !fileUrlInput.fileKey) return;
    await setFileInfo(fileUrlInput.fileUrl, fileUrlInput.fileKey);
    completeSetup();
  }, [
    user,
    fileUrlInput.fileUrl,
    fileUrlInput.fileKey,
    setFileInfo,
    completeSetup,
  ]);

  const canSubmit = Boolean(user && fileUrlInput.fileKey && !isValidating);

  return { ...fileUrlInput, handleSubmit, canSubmit };
}
