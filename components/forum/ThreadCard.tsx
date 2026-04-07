import Link from "next/link";
import { ArrowUpRight, MessageSquareText } from "lucide-react";

import ForumIdentity from "@/components/forum/ForumIdentity";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  ForumThread,
  formatForumTimestamp,
  truncateForumContent,
} from "@/lib/forum";

type Props = {
  thread: ForumThread;
};

function ThreadCard({ thread }: Props) {
  return (
    <Link href={`/forum/${thread.id}`} className="block">
      <Card className="group gap-0 overflow-hidden rounded-[28px] border-slate-200/80 bg-white/90 py-0 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_24px_60px_-30px_rgba(8,160,207,0.35)]">
        <CardHeader className="gap-5 px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <Badge
              variant="outline"
              className="rounded-full border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-700"
            >
              Forum Thread
            </Badge>
            <div className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-400 transition-colors group-hover:border-cyan-200 group-hover:bg-cyan-50 group-hover:text-cyan-700">
              <ArrowUpRight className="size-4" />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
              {thread.title}
            </h2>
            <p className="text-sm leading-7 whitespace-pre-wrap break-words text-slate-600 sm:text-[15px]">
              {truncateForumContent(thread.content)}
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-5">
          <ForumIdentity
            pseudonym={thread.pseudonym}
            avatar={thread.avatar}
            timestamp={formatForumTimestamp(thread.createdAt)}
          />
        </CardContent>
        <CardFooter className="justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
            <MessageSquareText className="size-4 text-cyan-600" />
            {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
          </div>
          <span className="text-sm font-medium text-slate-500 transition-colors group-hover:text-cyan-700">
            Join discussion
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

export default ThreadCard;
