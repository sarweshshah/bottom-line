import { beforeEach, describe, expect, it, vi } from "vitest";

const rateLimitedFetchMock = vi.fn();

vi.mock("@ui/lib/rateLimiter", () => ({
  rateLimitedFetch: rateLimitedFetchMock,
}));

describe("getComments", () => {
  beforeEach(() => {
    rateLimitedFetchMock.mockReset();
  });

  it("requests comments with no-store cache policy", async () => {
    rateLimitedFetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          comments: [],
        }),
        { status: 200 },
      ),
    );

    const { getComments } = await import("./figmaApi");
    await getComments("file_key_123", "token_123", "pat");

    expect(rateLimitedFetchMock).toHaveBeenCalledTimes(1);
    expect(rateLimitedFetchMock).toHaveBeenCalledWith(
      "https://api.figma.com/v1/files/file_key_123/comments?as_md=true",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
  });
});
