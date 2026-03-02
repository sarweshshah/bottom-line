export interface FigmaUser {
  id: string;
  handle: string;
  img_url: string;
}

export interface Vector {
  x: number;
  y: number;
}

export interface FrameOffset {
  node_id: string;
  node_offset: Vector;
}

export interface Region {
  x: number;
  y: number;
  region_height: number;
  region_width: number;
  comment_pin_corner?: string;
}

export interface FrameOffsetRegion {
  node_id: string;
  node_offset: Vector;
  region_height: number;
  region_width: number;
  comment_pin_corner?: string;
}

export type ClientMeta = Vector | FrameOffset | Region | FrameOffsetRegion;

export function hasNodeId(
  meta: ClientMeta,
): meta is FrameOffset | FrameOffsetRegion {
  return "node_id" in meta;
}

export interface RawComment {
  id: string;
  file_key: string;
  parent_id: string;
  user: FigmaUser;
  created_at: string;
  resolved_at: string | null;
  message: string;
  client_meta: ClientMeta | null;
  order_id?: number;
  reactions?: RawReaction[];
}

export interface RawReaction {
  user: FigmaUser;
  emoji: string;
  created_at: string;
}

export type ThreadStatus = "open" | "resolved";

export interface CommentReply {
  id: string;
  author: FigmaUser;
  message: string;
  createdAt: string;
  mentions: string[];
}

export interface CommentThread {
  id: string;
  fileKey: string;
  orderNumber: number | null;
  author: FigmaUser;
  message: string;
  createdAt: string;
  resolvedAt: string | null;
  status: ThreadStatus;
  replies: CommentReply[];
  replyCount: number;
  participants: FigmaUser[];
  clientMeta: ClientMeta | null;
  mentions: string[];
  lastUpdatedAt: string;
}

export type StatusFilter = "all" | "open" | "resolved";
export type SortOrder = "newest" | "oldest";

export interface StoredPreferences {
  pat: string;
  fileKey: string;
  fileUrl: string;
  userName: string;
  userAvatarUrl: string;
  userId: string;
  filterStatus: StatusFilter;
  sortOrder: SortOrder;
  cacheTTL: number;
}

export type StorageKey = keyof StoredPreferences;
