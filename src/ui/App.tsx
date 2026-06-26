import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import type { InitDataMessage, UIMessage } from "@shared/messages";
import { useAuthStore } from "@ui/store/authStore";
import { useCommentsStore } from "@ui/store/commentsStore";
import { SetupScreen } from "@ui/components/onboarding/SetupScreen";
import { ReconnectScreen } from "@ui/components/reconnect/ReconnectScreen";
import { DashboardLayout } from "@ui/components/dashboard/DashboardLayout";
import { SettingsScreen } from "@ui/components/settings/SettingsScreen";
import { ToastContainer } from "@ui/components/common/Toast";
import { ConsentDialog } from "@ui/components/common/ConsentDialog";
import { LoadingSpinner } from "@ui/components/common/LoadingSpinner";
import { UiResizeHandles } from "@ui/components/common/UiResizeHandles";
import { useAIStore } from "@ui/store/aiStore";
import { useFilterStore } from "@ui/store/filterStore";
import { useUiTheme } from "@ui/hooks/useUiTheme";
import { useUiResize } from "@ui/hooks/useUiResize";

export function App() {
  const { screen, initFromSandbox, showDashboard, themePreference, motionPreference } =
    useAuthStore(
      useShallow((s) => ({
        screen: s.screen,
        initFromSandbox: s.initFromSandbox,
        showDashboard: s.showDashboard,
        themePreference: s.themePreference,
        motionPreference: s.motionPreference,
      })),
    );

  useUiTheme(themePreference, motionPreference);
  const { startResize } = useUiResize();

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data?.pluginMessage as UIMessage | undefined;
      if (!msg) return;

      switch (msg.type) {
        case "INIT_DATA":
          initFromSandbox(msg as InitDataMessage);
          useCommentsStore.getState().initializeCacheTTL(msg.cacheTTLMinutes);
          useCommentsStore.getState().setCurrentPageId(msg.currentPageId);
          useAIStore.getState().initFromStorage();
          useFilterStore.getState().initFromStorage();
          useAuthStore.getState().fetchFileName();
          break;
        case "PAGE_CHANGED":
          useCommentsStore.getState().setCurrentPageId(msg.pageId);
          break;
        case "PAGE_THREADS_RESOLVED":
          useCommentsStore
            .getState()
            .setCurrentPageThreadIds(msg.requestId, msg.threadIds);
          break;
        case "THREAD_PAGE_MAP_CHUNK":
          useCommentsStore
            .getState()
            .appendThreadPageMapChunk(
              msg.requestId,
              msg.mappings,
              msg.done,
            );
          break;
      }
    }

    window.addEventListener("message", handleMessage);
    parent.postMessage({ pluginMessage: { type: "REQUEST_INIT" } }, "*");
    return () => window.removeEventListener("message", handleMessage);
  }, [initFromSandbox]);

  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col relative">
        {screen === "loading" && <LoadingSpinner message="Initializing..." />}
        {screen === "setup" && <SetupScreen />}
        {screen === "reconnect" && <ReconnectScreen />}
        {screen === "dashboard" && <DashboardLayout />}
        {screen === "settings" && <SettingsScreen onBack={showDashboard} />}
      </div>
      <ToastContainer />
      <ConsentDialog />
      <UiResizeHandles onStartResize={startResize} />
    </div>
  );
}
