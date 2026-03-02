import type { FigmaUser } from "@shared/types";

interface AvatarGroupProps {
  users: FigmaUser[];
  max?: number;
  size?: number;
}

function UserAvatar({ user, size }: { user: FigmaUser; size: number }) {
  if (user.img_url) {
    return (
      <img
        src={user.img_url}
        alt={user.handle}
        title={user.handle}
        width={size}
        height={size}
        className="rounded-full border-2 border-figma-bg object-cover"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
          target.nextElementSibling?.classList.remove("hidden");
        }}
      />
    );
  }

  const initials = user.handle
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      title={user.handle}
      style={{ width: size, height: size }}
      className="rounded-full border-2 border-figma-bg bg-figma-bg-tertiary flex items-center justify-center text-2xs font-medium text-figma-text-secondary"
    >
      {initials}
    </div>
  );
}

export function AvatarGroup({ users, max = 5, size = 22 }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((user) => (
        <UserAvatar key={user.id} user={user} size={size} />
      ))}
      {overflow > 0 && (
        <div
          style={{ width: size, height: size }}
          className="rounded-full border-2 border-figma-bg bg-figma-bg-tertiary flex items-center justify-center text-2xs font-medium text-figma-text-secondary"
          title={`${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
