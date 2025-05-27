
import { MOCK_GAMES } from '@/lib/constants';
import GameDetailView from './GameDetailView'; // GameDetailView is a Client Component
import type { Game } from '@/types';

// generateStaticParams is a server-side function
export async function generateStaticParams() {
  return MOCK_GAMES.map((game) => ({
    id: game.id,
  }));
}

// This default export is for a Server Component page
export default function GameDetailPage({ params }: { params: { id: string } }) {
  const game = MOCK_GAMES.find(g => g.id === params.id);

  if (!game) {
    return <div className="text-center py-10">游戏未找到</div>;
  }

  // Pass the server-fetched game data to the Client Component
  return <GameDetailView game={game as Game} />;
}
