export function requestAiConsent(onConsent: () => void) {
  window.dispatchEvent(
    new CustomEvent("show-ai-consent", {
      detail: { onConsent },
    }),
  );
}
