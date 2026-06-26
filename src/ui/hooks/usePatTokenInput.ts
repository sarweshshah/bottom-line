import { useState, useCallback } from "react";
import { useAuthStore } from "@ui/store/authStore";

type UsePatTokenInputOptions = {
  trackValidation?: boolean;
};

export function usePatTokenInput(options: UsePatTokenInputOptions = {}) {
  const validateAndSetToken = useAuthStore((s) => s.validateAndSetToken);
  const isValidating = useAuthStore((s) => s.isValidating);
  const validationError = useAuthStore((s) => s.validationError);
  const user = useAuthStore((s) => s.user);
  const authMethod = useAuthStore((s) => s.authMethod);

  const [pat, setPat] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  const handleTokenChange = useCallback(
    async (value: string) => {
      setPat(value);
      if (options.trackValidation) {
        setTokenValid(false);
      }
      if (!value.trim()) return;
      try {
        await validateAndSetToken(value.trim());
        if (options.trackValidation) {
          setTokenValid(true);
        }
      } catch {
        if (options.trackValidation) {
          setTokenValid(false);
        }
      }
    },
    [validateAndSetToken, options.trackValidation],
  );

  const clearPat = useCallback(() => {
    setPat("");
    setTokenValid(false);
  }, []);

  return {
    pat,
    showToken,
    setShowToken,
    handleTokenChange,
    clearPat,
    tokenValid,
    isValidating,
    validationError,
    user,
    authMethod,
  };
}
