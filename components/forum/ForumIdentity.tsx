"use client";

import { ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveForumAvatar } from "@/lib/forum";
import { cn } from "@/lib/utils";

type Props = {
  pseudonym: string;
  avatar: string;
  timestamp?: string;
  className?: string;
};

const initialLetters = (pseudonym: string) =>
  pseudonym
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

function ForumIdentity({ pseudonym, avatar, timestamp, className }: Props) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Avatar className="size-11 border border-slate-200/80 bg-white shadow-sm">
        <AvatarImage
          src={resolveForumAvatar(avatar)}
          alt={`${pseudonym} avatar`}
          className="bg-slate-50"
        />
        <AvatarFallback className="bg-linear-to-br from-cyan-100 via-sky-100 to-amber-100 text-slate-700">
          {initialLetters(pseudonym) || "AN"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-slate-900">{pseudonym}</p>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <ShieldCheck className="size-3" />
            Anonymous
          </span>
        </div>
        {timestamp ? (
          <p className="text-sm text-slate-500">{timestamp}</p>
        ) : (
          <p className="text-sm text-slate-500">Pseudonymous peer</p>
        )}
      </div>
    </div>
  );
}

export default ForumIdentity;
