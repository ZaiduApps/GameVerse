
export interface GameScreenshot {
  url: string;
  dataAiHint?: string;
}

export interface Game {
  id: string;
  title: string; // 标题 (Simplified Chinese)
  description: string; // 描述 (Simplified Chinese)
  shortDescription?: string; // 短描述 (Simplified Chinese)
  imageUrl: string; // 图片URL
  category: string; // 类别 (Simplified Chinese)
  rating?: number; // 评分 (optional)
  downloads?: string; // 下载量 (e.g., "500万+")
  version?: string; // 版本
  size?: string; // 大小
  tags?: string[]; // 标签 (Simplified Chinese)
  developer?: string; // 开发商 (Simplified Chinese)
  releaseDate?: string; // 发布日期
  updateDate?: string; // 更新日期 (optional)
  dataAiHint?: string; // For placeholder image generation
  screenshots?: GameScreenshot[]; // Array of game screenshots
}

export interface NewsArticle {
  id: string;
  gameId?: string; // To associate news with a game, optional
  title: string;
  content: string;
  excerpt?: string; // Short summary, optional
  imageUrl: string;
  dataAiHint?: string;
  category: string;
  date: string;
  author: string;
  tags?: string[];
}
