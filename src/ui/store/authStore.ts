import { create } from "zustand";
import type { FigmaUser, ThemePreference } from "@shared/types";
import type { InitDataMessage } from "@shared/messages";
import { deleteStorage, getStorage, setStorage } from "@ui/lib/storage";
import { validateToken, getFileName, FigmaApiError } from "@ui/api/figmaApi";

type AuthScreen = "loading" | "setup" | "reconnect" | "dashboard" | "settings";

interface AuthState {
  pat: string | null;
  user: FigmaUser | null;
  fileKey: string | null;
  fileUrl: string | null;
  fileName: string | null;
  screen: AuthScreen;
  isValidating: boolean;
  validationError: string | null;
  autoOpenComment: boolean;
  showThreadElbows: boolean;
  themePreference: ThemePreference;

  initFromSandbox: (data: InitDataMessage) => void;
  validateAndSetToken: (pat: string) => Promise<FigmaUser>;
  setFileInfo: (url: string, key: string) => Promise<void>;
  fetchFileName: () => Promise<void>;
  setAutoOpenComment: (enabled: boolean) => void;
  setShowThreadElbows: (enabled: boolean) => void;
  setThemePreference: (pref: ThemePreference) => void;
  completeSetup: () => void;
  showReconnect: () => void;
  showSettings: () => void;
  showDashboard: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  pat: null,
  user: null,
  fileKey: null,
  fileUrl: null,
  fileName: null,
  screen: "loading",
  isValidating: false,
  validationError: null,
  autoOpenComment: true,
  showThreadElbows: false,
  themePreference: "system",

  initFromSandbox: (data) => {
    const hasPat = !!data.pat;
    const hasFileKey = !!data.fileKey;
    const hasUser = !!data.userName;

    if (hasPat && hasFileKey && hasUser) {
      set({
        pat: data.pat,
        fileKey: data.fileKey,
        fileUrl: data.fileUrl,
        user: {
          id: data.userId!,
          handle: data.userName!,
          img_url: data.userAvatarUrl ?? "",
        },
        autoOpenComment: data.autoOpenComment,
        showThreadElbows: data.showThreadElbows === true,
        themePreference: data.themePreference ?? "system",
        screen: "dashboard",
      });
    } else {
      set({
        pat: data.pat,
        fileKey: data.fileKey,
        fileUrl: data.fileUrl,
        user: hasUser
          ? {
              id: data.userId!,
              handle: data.userName!,
              img_url: data.userAvatarUrl ?? "",
            }
          : null,
        autoOpenComment: data.autoOpenComment,
        showThreadElbows: data.showThreadElbows === true,
        themePreference: data.themePreference ?? "system",
        screen: "setup",
      });
    }

    getStorage<string>("fileName").then((name) => {
      if (name) set({ fileName: name });
    });
  },

  validateAndSetToken: async (pat: string) => {
    set({ isValidating: true, validationError: null });
    try {
      const user = await validateToken(pat);
      await Promise.all([
        setStorage("pat", pat),
        setStorage("userName", user.handle),
        setStorage("userAvatarUrl", user.img_url),
        setStorage("userId", user.id),
      ]);
      set({ pat, user, isValidating: false });
      return user;
    } catch (err) {
      const message =
        err instanceof FigmaApiError
          ? err.message
          : "Failed to validate token. Please try again.";
      set({ isValidating: false, validationError: message });
      throw err;
    }
  },

  setFileInfo: async (url: string, key: string) => {
    await Promise.all([setStorage("fileUrl", url), setStorage("fileKey", key)]);
    set({ fileUrl: url, fileKey: key, fileName: null });
    get().fetchFileName();
  },

  fetchFileName: async () => {
    const { pat, fileKey } = get();
    if (!pat || !fileKey) return;
    try {
      const name = await getFileName(fileKey, pat);
      set({ fileName: name });
      await setStorage("fileName", name);
    } catch {
      // non-critical — bar will remain empty or show fallback
    }
  },

  setAutoOpenComment: (enabled: boolean) => {
    set({ autoOpenComment: enabled });
    setStorage("autoOpenComment", enabled);
  },

  setShowThreadElbows: (enabled: boolean) => {
    set({ showThreadElbows: enabled });
    setStorage("showThreadElbows", enabled);
  },

  setThemePreference: (pref: ThemePreference) => {
    set({ themePreference: pref });
    setStorage("themePreference", pref);
  },

  completeSetup: () => {
    const { pat, fileKey, user } = get();
    if (pat && fileKey && user) {
      set({ screen: "dashboard" });
    }
  },

  showReconnect: () => {
    set({ screen: "reconnect", pat: null, user: null });
  },

  showSettings: () => {
    set({ screen: "settings" });
  },

  showDashboard: () => {
    const { pat, fileKey, user } = get();
    if (pat && fileKey && user) {
      set({ screen: "dashboard" });
    }
  },

  logout: async () => {
    await Promise.all([
      deleteStorage("pat"),
      deleteStorage("userName"),
      deleteStorage("userAvatarUrl"),
      deleteStorage("userId"),
      deleteStorage("fileKey"),
      deleteStorage("fileUrl"),
      deleteStorage("fileName"),
    ]);
    set({
      pat: null,
      user: null,
      fileKey: null,
      fileUrl: null,
      fileName: null,
      screen: "setup",
      validationError: null,
    });
  },
}));
