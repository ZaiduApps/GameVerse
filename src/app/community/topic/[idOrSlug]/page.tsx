import CommunityTopicBoardView from './CommunityTopicBoardView';

export default async function CommunityTopicPage({
  params,
}: {
  params: Promise<{ idOrSlug: string }>;
}) {
  const { idOrSlug } = await params;
  return <CommunityTopicBoardView idOrSlug={idOrSlug} />;
}
