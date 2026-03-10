import type { ReactNode } from "react";

const MD_MENTION_REGEX = /\[@([^\]]+)\]\(mention:[^)]+\)/g;
const PLAIN_MENTION_REGEX = /@([\w.-]+)/g;
const URL_REGEX = /https?:\/\/[^\s<>)"'\]]+/g;

type TokenType = "mention" | "url";
interface Token {
  type: TokenType;
  start: number;
  end: number;
  value: string; // display name for mentions, full URL for links
}

function MentionLink({ name }: { name: string }) {
  const profileUrl = `https://www.figma.com/@${name.replace(/\s+/g, "")}`;

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        window.open(profileUrl, "_blank");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") window.open(profileUrl, "_blank");
      }}
      style={{ color: "#3b82f6" }}
      className="font-semibold cursor-pointer hover:underline"
    >
      @{name}
    </span>
  );
}

function ExternalLink({ url }: { url: string }) {
  let display = url;
  try {
    const parsed = new URL(url);
    display = parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname : "");
    if (display.length > 40) display = display.slice(0, 37) + "…";
  } catch {
    // keep original
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-accent underline underline-offset-2 hover:text-accent-hover break-all"
    >
      {display}
    </a>
  );
}

function overlaps(a: Token, b: Token): boolean {
  return a.start < b.end && b.start < a.end;
}

function collectTokens(message: string): Token[] {
  const raw: Token[] = [];

  URL_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_REGEX.exec(message)) !== null) {
    const url = m[0].replace(/[.,;:!?)]+$/, "");
    raw.push({ type: "url", start: m.index, end: m.index + url.length, value: url });
  }

  const mentionRegex = message.includes("](mention:")
    ? MD_MENTION_REGEX
    : PLAIN_MENTION_REGEX;

  mentionRegex.lastIndex = 0;
  while ((m = mentionRegex.exec(message)) !== null) {
    const tok: Token = {
      type: "mention",
      start: m.index,
      end: m.index + m[0].length,
      value: m[1],
    };
    if (!raw.some((existing) => overlaps(existing, tok))) {
      raw.push(tok);
    }
  }

  raw.sort((a, b) => a.start - b.start);
  return raw;
}

export function renderMentions(message: string): ReactNode[] {
  const tokens = collectTokens(message);
  if (tokens.length === 0) return [message];

  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const token of tokens) {
    if (token.start > cursor) {
      parts.push(message.slice(cursor, token.start));
    }
    if (token.type === "mention") {
      parts.push(<MentionLink key={token.start} name={token.value} />);
    } else {
      parts.push(<ExternalLink key={token.start} url={token.value} />);
    }
    cursor = token.end;
  }

  if (cursor < message.length) {
    parts.push(message.slice(cursor));
  }

  return parts;
}
