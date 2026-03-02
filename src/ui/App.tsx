import { useEffect } from "react";
import type { InitDataMessage, UIMessage } from "@shared/messages";
import { useAuthStore } from "@ui/store/authStore";
import { SetupScreen } from "@ui/components/setup/SetupScreen";
import { ReconnectScreen } from "@ui/components/reconnect/ReconnectScreen";
import { DashboardLayout } from "@ui/components/dashboard/DashboardLayout";
import { ToastContainer } from "@ui/components/common/Toast";
import { LoadingSpinner } from "@ui/components/common/LoadingSpinner";

export function App() {
  const { screen, initFromSandbox } = useAuthStore();

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data?.pluginMessage as UIMessage | undefined;
      if (!msg) return;

      if (msg.type === "INIT_DATA") {
        initFromSandbox(msg as InitDataMessage);
      }
    }

    window.addEventListener("message", handleMessage);
    parent.postMessage({ pluginMessage: { type: "REQUEST_INIT" } }, "*");
    return () => window.removeEventListener("message", handleMessage);
  }, [initFromSandbox]);

  return (
    <>
      {screen === "loading" && <LoadingSpinner message="Initializing..." />}
      {screen === "setup" && <SetupScreen />}
      {screen === "reconnect" && <ReconnectScreen />}
      {screen === "dashboard" && <DashboardLayout />}
      <ToastContainer />
    </>
  );
}
