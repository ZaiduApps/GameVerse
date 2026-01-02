
'use client';

import GameDetailView from './GameDetailView';
import { useParams } from 'next/navigation';
import Loading from '../loading';

export default function GameDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!id) {
    // Or render a not found component
    return <Loading />;
  }

  return <GameDetailView id={id} />;
}
