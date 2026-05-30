import { useState } from "react";
import { User } from "lucide-react";
import type { FigmaUser } from "@shared/types";

interface AvatarGroupProps {
  users: FigmaUser[];
  max?: number;
  size?: number;
}

function UserAvatar({ user, size }: { user: FigmaUser; size: number }) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const showImage = Boolean(user.img_url) && !imageLoadFailed;
  const fallbackIconSize = Math.max(12, Math.floor(size * 0.48));

  return (
    <div
      title={user.handle}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      className="rounded-full bg-figma-bg-tertiary flex items-center justify-center text-xs font-medium text-figma-text-secondary overflow-hidden"
    >
      {showImage ? (
        <img
          src={user.img_url}
          alt={user.handle}
          className="w-full h-full object-cover"
          onError={() => setImageLoadFailed(true)}
        />
      ) : (
        <User size={fallbackIconSize} className="text-figma-icon-tertiary" />
      )}
    </div>
  );
}

export function AvatarGroup({ users, max = 5, size = 18 }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((user) => (
        <UserAvatar key={user.id} user={user} size={size} />
      ))}
      {overflow > 0 && (
        <div
          style={{ width: size, height: size, minWidth: size, minHeight: size }}
          className="rounded-full bg-accent-subtle flex items-center justify-center text-[10px] font-semibold text-accent"
          title={`${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
