import type { ClientMeta, FigmaAuthMethod } from "./types";

export interface GetStorageMessage {
  type: "GET_STORAGE";
  key: string;
  requestId: string;
}

export interface SetStorageMessage {
  type: "SET_STORAGE";
  key: string;
  value: unknown;
  requestId: string;
}

export interface DeleteStorageMessage {
  type: "DELETE_STORAGE";
  key: string;
  requestId: string;
}

export interface StorageResultMessage {
  type: "STORAGE_RESULT";
  requestId: string;
  value: unknown;
  error?: string;
}

export interface InitDataMessage {
  type: "INIT_DATA";
  pat: string | null;
  figmaAccessToken: string | null;
  figmaRefreshToken: string | null;
  figmaTokenExpiresAt: number | null;
  authMethod: FigmaAuthMethod | null;
  fileKey: string | null;
  fileUrl: string | null;
  userName: string | null;
  userAvatarUrl: string | null;
  userId: string | null;
  autoOpenComment: boolean;
  showThreadElbows: boolean;
  themePreference: "system" | "light" | "dark";
  cacheTTLMinutes: 5 | 10 | 15 | 30;
  currentPageId: string;
}

export interface PageChangedMessage {
  type: "PAGE_CHANGED";
  pageId: string;
}

export interface ResolvePageThreadsMessage {
  type: "RESOLVE_PAGE_THREADS";
  requestId: string;
  threads: { threadId: string; nodeId: string }[];
}

export interface PageThreadsResolvedMessage {
  type: "PAGE_THREADS_RESOLVED";
  requestId: string;
  threadIds: string[];
}

export interface NavigateToCommentMessage {
  type: "NAVIGATE_TO_COMMENT";
  clientMeta: ClientMeta;
  commentId: string;
}

export interface NavigateResultMessage {
  type: "NAVIGATE_RESULT";
  success: boolean;
  error?: string;
}

export interface NotifyMessage {
  type: "NOTIFY";
  message: string;
  error?: boolean;
}

export interface RequestInitMessage {
  type: "REQUEST_INIT";
}

export interface ResizeUIMessage {
  type: "RESIZE_UI";
  width: number;
  height: number;
}

export interface OpenExternalMessage {
  type: "OPEN_EXTERNAL";
  url: string;
}

export type SandboxMessage =
  | GetStorageMessage
  | SetStorageMessage
  | DeleteStorageMessage
  | NavigateToCommentMessage
  | NotifyMessage
  | RequestInitMessage
  | ResizeUIMessage
  | ResolvePageThreadsMessage
  | OpenExternalMessage;

export type UIMessage =
  | StorageResultMessage
  | InitDataMessage
  | NavigateResultMessage
  | PageChangedMessage
  | PageThreadsResolvedMessage;
