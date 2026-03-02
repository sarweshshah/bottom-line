import type { ReactNode } from "react";

// Matches both markdown-style mentions [@Name](mention:id) and plain @handle
const MD_MENTION_REGEX = /\[@([^\]]+)\]\(mention:[^)]+\)/g;
const PLAIN_MENTION_REGEX = /@([\w.-]+)/g;

function MentionLink({ name, index }: { name: string; index: number }) {
  const profileUrl = `https://www.figma.com/@${name.replace(/\s+/g, "")}`;

  return (
    <span
      key={index}
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

export function renderMentions(message: string): ReactNode[] {
  // First try markdown-style mentions (from as_md=true API response)
  if (message.includes("](mention:")) {
    return splitByRegex(message, MD_MENTION_REGEX);
  }
  // Fall back to plain @handle mentions
  if (message.includes("@")) {
    return splitByRegex(message, PLAIN_MENTION_REGEX);
  }
  return [message];
}

function splitByRegex(message: string, regex: RegExp): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  regex.lastIndex = 0;
  while ((match = regex.exec(message)) !== null) {
    if (match.index > lastIndex) {
      parts.push(message.slice(lastIndex, match.index));
    }
    parts.push(<MentionLink key={match.index} name={match[1]} index={match.index} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < message.length) {
    parts.push(message.slice(lastIndex));
  }

  return parts;
}
