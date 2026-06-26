import { useState, useCallback } from "react";
import { validateFigmaFileUrl } from "@ui/lib/parseFileUrl";

export function useFigmaFileUrlInput(initialUrl = "") {
  const [fileUrl, setFileUrl] = useState(initialUrl);
  const [fileKey, setFileKey] = useState<string | null>(() => {
    if (!initialUrl.trim()) return null;
    const result = validateFigmaFileUrl(initialUrl);
    return result.ok ? result.key : null;
  });
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleUrlChange = useCallback((value: string) => {
    setFileUrl(value);
    setUrlError(null);

    if (!value.trim()) {
      setFileKey(null);
      return;
    }

    const result = validateFigmaFileUrl(value);
    if (!result.ok) {
      setUrlError(result.error);
      setFileKey(null);
      return;
    }

    setFileKey(result.key);
  }, []);

  const validateForSave = useCallback((): boolean => {
    const result = validateFigmaFileUrl(fileUrl);
    if (!result.ok) {
      setUrlError(result.error);
      setFileKey(null);
      return false;
    }
    setUrlError(null);
    setFileKey(result.key);
    return true;
  }, [fileUrl]);

  const isValid = Boolean(fileKey && !urlError);

  return {
    fileUrl,
    fileKey,
    urlError,
    handleUrlChange,
    validateForSave,
    isValid,
  };
}
