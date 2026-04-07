import ForumThreadPage from "@/components/forum/ForumThreadPage";

export default async function ForumThreadRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ForumThreadPage threadId={id} />;
}
