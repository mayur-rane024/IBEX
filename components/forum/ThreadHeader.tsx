import ForumIdentity from "@/components/forum/ForumIdentity";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ForumThread, formatForumTimestamp } from "@/lib/forum";

type Props = {
  thread: ForumThread;
};

function ThreadHeader({ thread }: Props) {
  return (
    <Card className="gap-0 overflow-hidden rounded-[30px] border-slate-200/80 bg-white/92 py-0 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.35)]">
      <CardHeader className="gap-5 border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,rgba(103,232,249,0.18),transparent_40%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent_35%),white] px-6 py-7 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="rounded-full bg-slate-950 px-3 py-1 text-white hover:bg-slate-900">
            Anonymous Discussion
          </Badge>
          <Badge
            variant="outline"
            className="rounded-full border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-700"
          >
            Thread starter
          </Badge>
        </div>
        <div className="space-y-4">
          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {thread.title}
          </h1>
          <p className="max-w-4xl whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-700 sm:text-base">
            {thread.content}
          </p>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-5 sm:px-8">
        <ForumIdentity
          pseudonym={thread.pseudonym}
          avatar={thread.avatar}
          timestamp={formatForumTimestamp(thread.createdAt)}
        />
      </CardContent>
    </Card>
  );
}

export default ThreadHeader;
