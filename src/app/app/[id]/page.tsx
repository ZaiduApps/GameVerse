
import type { GameDetailData, ApiRecommendedGame } from '@/types';
import GameDetailView from './GameDetailView';
import { notFound } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getGameDetails(id: string): Promise<GameDetailData | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/game/details?param=${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const json = await res.json();
        return json.code === 0 ? json.data : null;
    } catch (error) {
        console.error("Failed to fetch game details:", error);
        return null;
    }
}

async function getRecommendedGames(pkg: string): Promise<ApiRecommendedGame[] | null> {
    if (!pkg) return null;
    try {
        const res = await fetch(`${API_BASE_URL}/game/recommendedApp?param=${pkg}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const json = await res.json();
        return json.code === 0 ? json.data : null;
    } catch (error) {
        console.error("Failed to fetch recommended games:", error);
        return null;
    }
}

export default async function GameDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  const initialGameData = await getGameDetails(id);

  if (!initialGameData) {
    notFound();
  }

  const initialRecommendedGames = await getRecommendedGames(initialGameData.app.pkg);

  return (
    <GameDetailView 
      id={id} 
      initialGameData={initialGameData}
      initialRecommendedGames={initialRecommendedGames}
    />
  );
}

    
