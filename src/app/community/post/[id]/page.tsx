
import { MOCK_COMMUNITY_POSTS } from '@/lib/constants';
import type { CommunityPost } from '@/types';
import CommunityPostDetailView from './CommunityPostDetailView';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return MOCK_COMMUNITY_POSTS.map((post) => ({
    id: post.id,
  }));
}

export default function CommunityPostPage({ params }: { params: { id: string } }) {
  const post = MOCK_COMMUNITY_POSTS.find(p => p.id === params.id);

  if (!post) {
    notFound();
  }

  return <CommunityPostDetailView post={post as CommunityPost} />;
}
