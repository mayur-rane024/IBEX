import Link from "next/link";

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
    <li className="list-none">
      <Link
        href={`/forum/${thread.id}`}
        className="block rounded-xl px-2 py-5 transition-colors hover:bg-white/70"
      >
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-950">{thread.title}</h2>
          <p className="text-sm text-slate-500">
            {thread.pseudonym} · {formatForumTimestamp(thread.createdAt)} ·{" "}
            {thread.replyCount} {thread.replyCount === 1 ? "reply" : "replies"}
          </p>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            {truncateForumContent(thread.content, 240)}
          </p>
        </div>
      </Link>
    </li>
  );
}

export default ThreadCard;
