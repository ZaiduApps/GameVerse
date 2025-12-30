
export interface GameScreenshot {
  url: string;
  dataAiHint?: string;
}

export interface Game {
  id: string; // was _id from api
  title: string; // was name from api
  description: string; // was summary from api
  shortDescription?: string; // was summary from api
  imageUrl: string; // was icon from api
  bannerUrl?: string; // was header_image from api
  category: string; // was tags[0] from api
  rating?: number; // was star from api
  downloads?: string; // not in api for now
  version?: string; // not in api for now
  size?: string; // not in api for now
  tags?: string[]; // was tags from api
  developer?: string; // not in api for now
  releaseDate?: string; // not in api for now
  updateDate?: string; // not in api for now
  dataAiHint?: string;
  screenshots?: GameScreenshot[];
  status?: 'released' | 'pre-registration' | 'coming_soon';
  pkg?: string; // package name
}

export interface NewsArticle {
  id: string; // was _id from api
  gameId?: string; // To associate news with a game, optional
  title: string; // was name from api
  content: string; // was content from api
  excerpt?: string; // was summary from api
  imageUrl: string; // was image_cover from api
  dataAiHint?: string;
  category: string; // was tags[0] from api
  date: string; // was release_at from api
  author: string; // was author from api
  tags?: string[]; // was tags from api
}

export interface ForumSection {
  id: string;
  name: string;
  icon?: React.ElementType; // Lucide icon component
  imageUrl?: string; // For game-specific icons
  dataAiHint?: string;
  href: string;
  type: 'link' | 'game' | 'action';
}

export interface CommunityPost {
  id:string;
  user: {
    name: string;
    avatarUrl: string;
    dataAiHint?: string;
    level?: number;
    location?: string;
  };
  timestamp: string;
  source?: string; // e.g., "来自web", "来自Android"
  title?: string;
  content: string;
  imageUrl?: string; // Optional image in the post
  imageAiHint?: string;
  tags?: string[];
  category?: string; // e.g., "游戏综合区"
  commentsCount: number;
  likesCount: number;
}

// API Types
export interface ApiBanner {
  _id: string;
  name: string;
  description: string;
  url_image: string;
  url_link: string;
  goto_type: 'game' | 'url' | 'article' | 'news';
  game?: ApiGame; // Optional game details
}

export interface ApiGame {
  _id: string;
  pkg: string;
  name: string;
  summary: string;
  star: number;
  icon: string;
  header_image: string;
  tags: string[];
  metadata: {
    en: string;
    chs: string;
    cht: string;
t: string;
    region: string;
    deviceList: string[];
    android_url: string;
  }
}

export interface ApiAlbum {
  _id: string;
  title: string;
  subtitle: string;
  style: 'Grid' | 'Box' | 'Pre' | string; // Grid: NewRelease, Box: Popular, Pre: Prereg
  games: ApiGame[];
}

export interface ApiArticle {
  _id: string;
  name: string;
  summary: string;
  image_cover: string;
  release_at: string;
  source: string;
  author: string;
  tags: string[];
  content: string;
}

export interface HomeData {
  banner: ApiBanner[];
  albums: ApiAlbum[];
  articles: ApiArticle[];
}
