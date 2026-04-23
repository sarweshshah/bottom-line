import { describe, expect, it } from "vitest";
import type { RawComment } from "@shared/types";
import { normalizeComments } from "./normalize";

function makeUser(id: string, handle: string) {
  return { id, handle, img_url: "" };
}

describe("normalizeComments", () => {
  it("groups replies, sorts chronologically, and derives mentions/participants", () => {
    const raw: RawComment[] = [
      {
        id: "reply-2",
        file_key: "FILE123",
        parent_id: "thread-1",
        user: makeUser("u2", "bob"),
        created_at: "2026-01-01T11:00:00.000Z",
        resolved_at: null,
        message: "Looks good @dana",
        client_meta: null,
      },
      {
        id: "thread-1",
        file_key: "FILE123",
        parent_id: "",
        user: makeUser("u1", "alice"),
        created_at: "2026-01-01T09:00:00.000Z",
        resolved_at: null,
        message: "Please review [@bob](mention:1) and @charlie",
        client_meta: null,
      },
      {
        id: "reply-1",
        file_key: "FILE123",
        parent_id: "thread-1",
        user: makeUser("u1", "alice"),
        created_at: "2026-01-01T10:00:00.000Z",
        resolved_at: null,
        message: "Addressed",
        client_meta: null,
      },
    ];

    const [thread] = normalizeComments(raw);

    expect(thread.id).toBe("thread-1");
    expect(thread.replyCount).toBe(2);
    expect(thread.replies.map((r) => r.id)).toEqual(["reply-1", "reply-2"]);
    expect(thread.participants.map((p) => p.id)).toEqual(["u1", "u2"]);
    expect(thread.mentions.sort()).toEqual(["bob", "charlie", "dana"]);
    expect(thread.lastUpdatedAt).toBe("2026-01-01T11:00:00.000Z");
    expect(thread.status).toBe("open");
  });

  it("marks thread as resolved when root has resolved_at", () => {
    const raw: RawComment[] = [
      {
        id: "thread-2",
        file_key: "FILE123",
        parent_id: "",
        user: makeUser("u1", "alice"),
        created_at: "2026-01-01T09:00:00.000Z",
        resolved_at: "2026-01-02T09:00:00.000Z",
        message: "Finalized",
        client_meta: null,
      },
    ];

    const [thread] = normalizeComments(raw);
    expect(thread.status).toBe("resolved");
  });
});
