import ForumIdentity from "@/components/forum/ForumIdentity";
import { Divider } from "@/components/ui/divider";
import { ForumThread, formatForumTimestamp } from "@/lib/forum";

type Props = {
  thread: ForumThread;
};

function ThreadHeader({ thread }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold text-slate-950">{thread.title}</h1>
        <p className="max-w-3xl whitespace-pre-wrap text-base leading-8 text-slate-600">
          {thread.content}
        </p>
      </div>
      <ForumIdentity
        pseudonym={thread.pseudonym}
        avatar={thread.avatar}
        timestamp={formatForumTimestamp(thread.createdAt)}
      />
      <Divider />
    </div>
  );
}

export default ThreadHeader;
