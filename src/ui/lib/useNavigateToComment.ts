import { useState, useCallback, useRef, useEffect } from "react";
import type { ClientMeta } from "@shared/types";
import type {
  NavigateToCommentMessage,
  NavigateResultMessage,
} from "@shared/messages";
import { showToast } from "@ui/components/common/Toast";

const NAV_TIMEOUT_MS = 5000;

export function useNavigateToComment(
  clientMeta: ClientMeta | null,
  commentId: string,
) {
  const [navigating, setNavigating] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  const navigate = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!clientMeta || navigating) return;
      setNavigating(true);

      cleanupRef.current?.();

      const handler = (event: MessageEvent) => {
        const msg = event.data?.pluginMessage as
          | NavigateResultMessage
          | undefined;
        if (!msg || msg.type !== "NAVIGATE_RESULT") return;
        window.removeEventListener("message", handler);
        clearTimeout(timer);
        cleanupRef.current = null;
        setNavigating(false);
        if (!msg.success && msg.error) {
          showToast(msg.error, "error");
        }
      };

      window.addEventListener("message", handler);

      const navMsg: NavigateToCommentMessage = {
        type: "NAVIGATE_TO_COMMENT",
        clientMeta,
        commentId,
      };
      parent.postMessage({ pluginMessage: navMsg }, "*");

      const timer = setTimeout(() => {
        window.removeEventListener("message", handler);
        cleanupRef.current = null;
        setNavigating(false);
      }, NAV_TIMEOUT_MS);

      cleanupRef.current = () => {
        window.removeEventListener("message", handler);
        clearTimeout(timer);
      };
    },
    [clientMeta, commentId, navigating],
  );

  return { navigating, navigate };
}
