import { create } from "zustand";
import type { FigmaUser } from "@shared/types";
import type { InitDataMessage } from "@shared/messages";
import { setStorage } from "@ui/lib/storage";
import { validateToken, FigmaApiError } from "@ui/api/figmaApi";

type AuthScreen = "loading" | "setup" | "reconnect" | "dashboard";

interface AuthState {
  pat: string | null;
  user: FigmaUser | null;
  fileKey: string | null;
  fileUrl: string | null;
  screen: AuthScreen;
  isValidating: boolean;
  validationError: string | null;

  initFromSandbox: (data: InitDataMessage) => void;
  validateAndSetToken: (pat: string) => Promise<FigmaUser>;
  setFileInfo: (url: string, key: string) => Promise<void>;
  completeSetup: () => void;
  showReconnect: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  pat: null,
  user: null,
  fileKey: null,
  fileUrl: null,
  screen: "loading",
  isValidating: false,
  validationError: null,

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
        screen: "dashboard",
      });
    } else {
      set({
        pat: data.pat,
        fileKey: data.fileKey,
        fileUrl: data.fileUrl,
        user: hasUser
          ? { id: data.userId!, handle: data.userName!, img_url: data.userAvatarUrl ?? "" }
          : null,
        screen: "setup",
      });
    }
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
    set({ fileUrl: url, fileKey: key });
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

  logout: () => {
    set({
      pat: null,
      user: null,
      fileKey: null,
      fileUrl: null,
      screen: "setup",
    });
  },
}));
