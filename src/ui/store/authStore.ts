import { create } from "zustand";
import type { FigmaUser, ThemePreference, MotionPreference, FigmaAuthMethod } from "@shared/types";
import type { InitDataMessage } from "@shared/messages";
import { deleteStorage, getStorage, setStorage } from "@ui/lib/storage";
import { validateToken, getFileName, FigmaApiError } from "@ui/api/figmaApi";
import { isFigmaOAuthConfigured, refreshOAuthAccessToken } from "@ui/lib/figmaOAuth";

type AuthScreen = "loading" | "setup" | "reconnect" | "dashboard" | "settings";

export interface RestAuth {
  token: string;
  mode: FigmaAuthMethod;
}

interface AuthState {
  pat: string | null;
  figmaAccessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null;
  authMethod: FigmaAuthMethod | null;
  user: FigmaUser | null;
  fileKey: string | null;
  fileUrl: string | null;
  fileName: string | null;
  screen: AuthScreen;
  isValidating: boolean;
  validationError: string | null;
  showThreadElbows: boolean;
  themePreference: ThemePreference;
  motionPreference: MotionPreference;

  initFromSandbox: (data: InitDataMessage) => void;
  getRestAuth: () => RestAuth | null;
  tryRefreshOAuthToken: () => Promise<boolean>;
  applyOAuthSession: (tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }) => Promise<FigmaUser>;
  validateAndSetToken: (pat: string) => Promise<FigmaUser>;
  setFileInfo: (url: string, key: string) => Promise<void>;
  fetchFileName: () => Promise<void>;
  setShowThreadElbows: (enabled: boolean) => void;
  setThemePreference: (pref: ThemePreference) => void;
  setMotionPreference: (pref: MotionPreference) => void;
  completeSetup: () => void;
  showReconnect: () => Promise<void>;
  showSettings: () => void;
  showDashboard: () => void;
  logout: () => Promise<void>;
}

function resolveAuthFromInit(data: InitDataMessage): Pick<
  AuthState,
  "pat" | "figmaAccessToken" | "refreshToken" | "tokenExpiresAt" | "authMethod"
> {
  let authMethod = data.authMethod;
  if (!authMethod && data.pat) authMethod = "pat";
  if (!authMethod && data.figmaAccessToken) authMethod = "oauth";

  return {
    pat: authMethod === "pat" ? data.pat : null,
    figmaAccessToken: authMethod === "oauth" ? data.figmaAccessToken : null,
    refreshToken: authMethod === "oauth" ? data.figmaRefreshToken : null,
    tokenExpiresAt: authMethod === "oauth" ? data.figmaTokenExpiresAt : null,
    authMethod,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  pat: null,
  figmaAccessToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
  authMethod: null,
  user: null,
  fileKey: null,
  fileUrl: null,
  fileName: null,
  screen: "loading",
  isValidating: false,
  validationError: null,
  showThreadElbows: false,
  themePreference: "system",
  motionPreference: "system",

  getRestAuth: () => {
    const { authMethod, pat, figmaAccessToken } = get();
    if (authMethod === "pat" && pat) return { token: pat, mode: "pat" };
    if (authMethod === "oauth" && figmaAccessToken) {
      return { token: figmaAccessToken, mode: "oauth" };
    }
    return null;
  },

  initFromSandbox: (data) => {
    const auth = resolveAuthFromInit(data);
    const hasFileKey = !!data.fileKey;
    const hasUser = !!data.userName;
    const tokenReady =
      (auth.authMethod === "pat" && !!auth.pat) ||
      (auth.authMethod === "oauth" && !!auth.figmaAccessToken);

    if (tokenReady && hasFileKey && hasUser) {
      set({
        ...auth,
        fileKey: data.fileKey,
        fileUrl: data.fileUrl,
        user: {
          id: data.userId!,
          handle: data.userName!,
          img_url: data.userAvatarUrl ?? "",
        },
        showThreadElbows: data.showThreadElbows === true,
        themePreference: data.themePreference ?? "system",
        motionPreference: data.motionPreference ?? "system",
        screen: "dashboard",
      });
    } else {
      set({
        ...auth,
        fileKey: data.fileKey,
        fileUrl: data.fileUrl,
        user: hasUser
          ? {
              id: data.userId!,
              handle: data.userName!,
              img_url: data.userAvatarUrl ?? "",
            }
          : null,
        showThreadElbows: data.showThreadElbows === true,
        themePreference: data.themePreference ?? "system",
        motionPreference: data.motionPreference ?? "system",
        screen: "setup",
      });
    }

    getStorage<string>("fileName").then((name) => {
      if (name) set({ fileName: name });
    });
  },

  tryRefreshOAuthToken: async () => {
    const { authMethod, refreshToken } = get();
    if (authMethod !== "oauth" || !refreshToken) return false;
    if (!isFigmaOAuthConfigured()) return false;
    try {
      const data = await refreshOAuthAccessToken(refreshToken);
      const expiresAt = Date.now() + data.expires_in * 1000;
      await Promise.all([
        setStorage("figmaAccessToken", data.access_token),
        setStorage("figmaTokenExpiresAt", expiresAt),
      ]);
      set({
        figmaAccessToken: data.access_token,
        tokenExpiresAt: expiresAt,
      });
      return true;
    } catch {
      return false;
    }
  },

  applyOAuthSession: async (tokens) => {
    set({ isValidating: true, validationError: null });
    try {
      const user = await validateToken(tokens.access_token, "oauth");
      const expiresAt = Date.now() + tokens.expires_in * 1000;
      await Promise.all([
        deleteStorage("pat"),
        setStorage("authMethod", "oauth"),
        setStorage("figmaAccessToken", tokens.access_token),
        setStorage("figmaRefreshToken", tokens.refresh_token),
        setStorage("figmaTokenExpiresAt", expiresAt),
        setStorage("userName", user.handle),
        setStorage("userAvatarUrl", user.img_url),
        setStorage("userId", user.id),
      ]);
      set({
        pat: null,
        figmaAccessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        authMethod: "oauth",
        user,
        isValidating: false,
        validationError: null,
      });
      return user;
    } catch (err) {
      const message =
        err instanceof FigmaApiError
          ? err.message
          : "Failed to validate session. Please try again.";
      set({ isValidating: false, validationError: message });
      throw err;
    }
  },

  validateAndSetToken: async (pat: string) => {
    set({ isValidating: true, validationError: null });
    try {
      await Promise.all([
        deleteStorage("figmaAccessToken"),
        deleteStorage("figmaRefreshToken"),
        deleteStorage("figmaTokenExpiresAt"),
      ]);
      set({
        figmaAccessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
      });

      const user = await validateToken(pat, "pat");
      await Promise.all([
        setStorage("pat", pat),
        setStorage("authMethod", "pat"),
        setStorage("userName", user.handle),
        setStorage("userAvatarUrl", user.img_url),
        setStorage("userId", user.id),
      ]);
      set({
        pat,
        authMethod: "pat",
        user,
        isValidating: false,
      });
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
    get().fetchFileName();
  },

  fetchFileName: async () => {
    const auth = get().getRestAuth();
    const { fileKey } = get();
    if (!auth || !fileKey) return;
    try {
      const name = await getFileName(fileKey, auth.token, auth.mode);
      set({ fileName: name });
      await setStorage("fileName", name);
    } catch {
      // non-critical — bar will remain empty or show fallback
    }
  },

  setShowThreadElbows: (enabled: boolean) => {
    set({ showThreadElbows: enabled });
    setStorage("showThreadElbows", enabled);
  },

  setThemePreference: (pref: ThemePreference) => {
    set({ themePreference: pref });
    setStorage("themePreference", pref);
  },

  setMotionPreference: (pref: MotionPreference) => {
    set({ motionPreference: pref });
    setStorage("motionPreference", pref);
  },

  completeSetup: () => {
    const { fileKey, user } = get();
    const auth = get().getRestAuth();
    if (auth && fileKey && user) {
      set({ screen: "dashboard" });
    }
  },

  showReconnect: async () => {
    await Promise.all([
      deleteStorage("pat"),
      deleteStorage("figmaAccessToken"),
      deleteStorage("figmaRefreshToken"),
      deleteStorage("figmaTokenExpiresAt"),
      deleteStorage("authMethod"),
      deleteStorage("userName"),
      deleteStorage("userAvatarUrl"),
      deleteStorage("userId"),
    ]);
    set({
      pat: null,
      figmaAccessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      authMethod: null,
      user: null,
      screen: "reconnect",
    });
  },

  showSettings: () => {
    set({ screen: "settings" });
  },

  showDashboard: () => {
    const { fileKey, user } = get();
    const auth = get().getRestAuth();
    if (auth && fileKey && user) {
      set({ screen: "dashboard" });
    }
  },

  logout: async () => {
    await Promise.all([
      deleteStorage("pat"),
      deleteStorage("figmaAccessToken"),
      deleteStorage("figmaRefreshToken"),
      deleteStorage("figmaTokenExpiresAt"),
      deleteStorage("authMethod"),
      deleteStorage("userName"),
      deleteStorage("userAvatarUrl"),
      deleteStorage("userId"),
      deleteStorage("fileKey"),
      deleteStorage("fileUrl"),
      deleteStorage("fileName"),
    ]);
    set({
      pat: null,
      figmaAccessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      authMethod: null,
      user: null,
      fileKey: null,
      fileUrl: null,
      fileName: null,
      screen: "setup",
      validationError: null,
    });
  },
}));
