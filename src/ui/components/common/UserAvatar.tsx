import { useState } from "react";
import {
  getAvatarColor,
  getAvatarFontSize,
  getFirstInitial,
} from "@ui/lib/avatarUtils";

interface UserAvatarProps {
  handle: string;
  imgUrl?: string;
  size: number;
  colorKey?: string;
  backgroundColor?: string;
  className?: string;
}

export function UserAvatar({
  handle,
  imgUrl,
  size,
  colorKey,
  backgroundColor: backgroundColorOverride,
  className = "",
}: UserAvatarProps) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const showImage = Boolean(imgUrl) && !imageLoadFailed;
  const initial = getFirstInitial(handle);
  const backgroundColor =
    backgroundColorOverride ?? getAvatarColor(colorKey ?? handle);
  const fontSize = getAvatarFontSize(size);

  return (
    <div
      title={handle}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        ...(showImage ? {} : { backgroundColor }),
      }}
      className={`rounded-full flex items-center justify-center overflow-hidden shrink-0 ${className}`}
    >
      {showImage ? (
        <img
          src={imgUrl}
          alt={handle}
          className="w-full h-full object-cover"
          onError={() => setImageLoadFailed(true)}
        />
      ) : (
        <span
          className="font-regular uppercase leading-none text-white select-none"
          style={{ fontSize }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}
