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
export type SortField = "replies" | "participants" | "last_updated" | "created_at";
export type SortDirection = "asc" | "desc";
export type CommentScope = "current_page" | "full_file";
export type CacheTTLMinutes = 5 | 10 | 15 | 30;

export type AIProvider = "anthropic" | "openai" | "gemini" | "custom";
export type TaskType = "revision" | "approval" | "blocker" | "question" | "general";
export type TaskStatus = "pending" | "done";

export interface Task {
  id: string;
  threadId: string;
  description: string;
  assignee: string | null;
  status: TaskStatus;
  sourceCommentId: string;
  detectedPattern: string;
  type: TaskType;
}

export interface SummaryResult {
  summary: string;
  tasks: Task[];
  generatedAt: string;
  threadLastUpdatedAt: string;
  provider: AIProvider;
  modelName: string;
}

export interface CustomProviderConfig {
  baseUrl: string;
  apiKey: string;
  modelName: string;
}

export interface StoredPreferences {
  pat: string;
  fileKey: string;
  fileUrl: string;
  userName: string;
  userAvatarUrl: string;
  userId: string;
  filterStatus: StatusFilter;
  sortField: SortField;
  sortDirection: SortDirection;
  cacheTTL: CacheTTLMinutes;
  autoOpenComment: boolean;
  showThreadElbows: boolean;
  aiProvider: AIProvider;
  anthropicApiKey: string;
  openaiApiKey: string;
  geminiApiKey: string;
  customProviderConfig: CustomProviderConfig;
  imageAnalysisEnabled: boolean;
  cloudAiConsented: boolean;
  cloudAiConsentIncludesImages: boolean;
}

export type StorageKey = keyof StoredPreferences;
