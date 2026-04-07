"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveForumAvatar } from "@/lib/forum";
import { cn } from "@/lib/utils";

type Props = {
  pseudonym: string;
  avatar: string;
  timestamp?: string;
  className?: string;
};

const initialsFromPseudonym = (pseudonym: string) =>
  pseudonym
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

function ForumIdentity({ pseudonym, avatar, timestamp, className }: Props) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Avatar className="size-9">
        <AvatarImage
          src={resolveForumAvatar(avatar)}
          alt={`${pseudonym} avatar`}
        />
        <AvatarFallback>{initialsFromPseudonym(pseudonym) || "IB"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{pseudonym}</p>
        {timestamp ? (
          <p className="text-xs text-slate-500">{timestamp}</p>
        ) : null}
      </div>
    </div>
  );
}

export default ForumIdentity;
