import type {
  RawComment,
  CommentThread,
  CommentReply,
  FigmaUser,
  ThreadStatus,
} from "@shared/types";

const MENTION_REGEX = /@[\w.-]+/g;

function extractMentions(message: string): string[] {
  const matches = message.match(MENTION_REGEX);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1)))];
}

function dedupeUsers(users: FigmaUser[]): FigmaUser[] {
  const seen = new Set<string>();
  return users.filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });
}

function toReply(comment: RawComment): CommentReply {
  return {
    id: comment.id,
    author: comment.user,
    message: comment.message,
    createdAt: comment.created_at,
    mentions: extractMentions(comment.message),
  };
}

export function normalizeComments(raw: RawComment[]): CommentThread[] {
  const topLevel = raw.filter((c) => !c.parent_id);
  const repliesByParent = new Map<string, RawComment[]>();

  for (const comment of raw) {
    if (comment.parent_id) {
      const existing = repliesByParent.get(comment.parent_id) ?? [];
      existing.push(comment);
      repliesByParent.set(comment.parent_id, existing);
    }
  }

  return topLevel.map((root) => {
    const rawReplies = repliesByParent.get(root.id) ?? [];
    rawReplies.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    const replies = rawReplies.map(toReply);
    const allComments = [root, ...rawReplies];
    const participants = dedupeUsers(allComments.map((c) => c.user));

    const allMentions = allComments.flatMap((c) =>
      extractMentions(c.message),
    );
    const mentions = [...new Set(allMentions)];

    const lastComment = rawReplies.length > 0
      ? rawReplies[rawReplies.length - 1]
      : root;

    const status: ThreadStatus = root.resolved_at ? "resolved" : "open";

    return {
      id: root.id,
      fileKey: root.file_key,
      orderNumber: root.order_id ?? null,
      author: root.user,
      message: root.message,
      createdAt: root.created_at,
      resolvedAt: root.resolved_at,
      status,
      replies,
      replyCount: replies.length,
      participants,
      clientMeta: root.client_meta,
      mentions,
      lastUpdatedAt: lastComment.created_at,
    };
  });
}
