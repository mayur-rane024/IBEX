export type ForumThread = {
  id: string;
  title: string;
  content: string;
  pseudonym: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
};

export type ForumReply = {
  id: string;
  content: string;
  pseudonym: string;
  avatar: string;
  createdAt: string;
  replies: ForumReply[];
};

export type ForumThreadDetail = {
  thread: ForumThread;
  replies: ForumReply[];
};

export type ForumThreadsResponse = {
  items: ForumThread[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiFailure = {
  success: false;
  message: string;
};

export const readApiResponse = async <T>(response: Response) => {
  const payload = (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | ApiFailure
    | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload && "message" in payload ? payload.message : "Request failed",
    );
  }

  return payload.data;
};

export const resolveForumAvatar = (avatar: string) => {
  if (!avatar) {
    return "";
  }

  if (avatar.startsWith("bottts-neutral:")) {
    const seed = avatar.replace("bottts-neutral:", "");
    return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}`;
  }

  return avatar;
};

export const formatForumTimestamp = (value: string | Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export const truncateForumContent = (content: string, maxLength = 180) => {
  if (content.length <= maxLength) {
    return content;
  }

  return `${content.slice(0, maxLength).trimEnd()}...`;
};

export const flattenReplyIds = (replies: ForumReply[]): string[] =>
  replies.flatMap((reply) => [reply.id, ...flattenReplyIds(reply.replies)]);
