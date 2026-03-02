import type { ClientMeta } from "./types";

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
  fileKey: string | null;
  fileUrl: string | null;
  userName: string | null;
  userAvatarUrl: string | null;
  userId: string | null;
}

export interface NavigateToCommentMessage {
  type: "NAVIGATE_TO_COMMENT";
  clientMeta: ClientMeta;
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

export type SandboxMessage =
  | GetStorageMessage
  | SetStorageMessage
  | DeleteStorageMessage
  | NavigateToCommentMessage
  | NotifyMessage
  | RequestInitMessage;

export type UIMessage =
  | StorageResultMessage
  | InitDataMessage
  | NavigateResultMessage;
