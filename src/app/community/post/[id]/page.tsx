
import { MOCK_COMMUNITY_POSTS } from '@/lib/constants';
import type { CommunityPost } from '@/types';
import CommunityPostDetailView from './CommunityPostDetailView';
import { notFound } from 'next/navigation';
import {
  getCommunityCommentThreads,
  getCommunityPostById,
  type CommunityCommentThread,
} from '@/lib/community-api';

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [apiPost, apiComments] = await Promise.all([
    getCommunityPostById(id),
    getCommunityCommentThreads(id, 30),
  ]);

  const post = apiPost || MOCK_COMMUNITY_POSTS.find(p => p.id === id);

  if (!post) {
    notFound();
  }

  return (
    <CommunityPostDetailView
      post={post as CommunityPost}
      initialComments={apiComments as CommunityCommentThread[]}
    />
  );
}
