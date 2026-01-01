
import GameDetailView from './GameDetailView';
import type { GameDetailData } from '@/types';
import { notFound } from 'next/navigation';

async function getGameDetails(id: string): Promise<GameDetailData | null> {
    try {
        const res = await fetch(`http://localhost:9002/api/game/details?param=${id}`, { cache: 'no-store' });
        if (!res.ok) {
            throw new Error(`Failed to fetch game details: ${res.statusText}`);
        }
        const jsonResponse = await res.json();
        if (jsonResponse.code !== 0 || !jsonResponse.data) {
            console.error("API error or no data:", jsonResponse.message);
            return null;
        }
        return jsonResponse.data;
    } catch (error) {
        console.error("Error fetching game details:", error);
        return null;
    }
}


export default async function GameDetailPage({ params }: { params: { id: string } }) {
  const gameData = await getGameDetails(params.id);

  if (!gameData) {
    return notFound();
  }

  return <GameDetailView gameData={gameData} />;
}

    