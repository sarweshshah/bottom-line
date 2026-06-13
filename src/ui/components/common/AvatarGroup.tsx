import { useMemo } from "react";
import type { FigmaUser } from "@shared/types";
import { assignAdjacentAvatarColors } from "@ui/lib/avatarUtils";
import { UserAvatar } from "./UserAvatar";

interface AvatarGroupProps {
  users: FigmaUser[];
  max?: number;
  size?: number;
}

export function AvatarGroup({ users, max = 5, size = 18 }: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;
  const colorsByUserId = useMemo(
    () => assignAdjacentAvatarColors(visible.map((user) => user.id)),
    [users, max],
  );

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((user) => (
        <UserAvatar
          key={user.id}
          handle={user.handle}
          imgUrl={user.img_url}
          backgroundColor={colorsByUserId.get(user.id)}
          size={size}
        />
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
