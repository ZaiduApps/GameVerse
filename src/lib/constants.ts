import type { Game, NewsArticle, ForumSection, CommunityPost } from '@/types';
import {
  Heart,
  ThumbsUp,
  Gamepad2 as GameIcon,
  ChevronRight,
} from 'lucide-react';

const generateMockScreenshots = (gameTitleHint: string, count: number = 5): Game['screenshots'] =>
  Array.from({ length: count }, (_, i) => ({
    url: 'https://placehold.co/400x225.png',
    dataAiHint: `${gameTitleHint} gameplay ${i + 1}`,
  }));

export const MOCK_GAMES: Game[] = [
  {
    id: '1',
    pkg: 'com.tencent.tmgp.sgame',
    title: '王者荣耀',
    shortDescription: '腾讯天美工作室推出的 MOBA 手游。',
    description: '经典 5V5 团队竞技手游，节奏快、对抗强。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'moba king battle',
    category: 'MOBA',
    rating: 4.8,
    downloads: '2亿',
    tags: ['竞技', '团队', '策略'],
    developer: '腾讯天美',
    releaseDate: '2015-11-26',
    updateDate: '2026-03-20',
    screenshots: generateMockScreenshots('moba king battle'),
    version: '10.3.1',
    size: '1.8GB',
    status: 'released',
  },
  {
    id: '2',
    pkg: 'com.tencent.ig',
    title: 'PUBG MOBILE',
    shortDescription: '多人战术竞技吃鸡手游。',
    description: '百人同场竞技，强调战术、配合与生存能力。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'pubg battle royale',
    category: '射击',
    rating: 4.7,
    downloads: '1.5亿',
    tags: ['生存', '战术', '射击'],
    developer: 'Tencent Games',
    releaseDate: '2019-05-08',
    updateDate: '2026-03-19',
    screenshots: generateMockScreenshots('pubg battle royale'),
    version: '3.7.0',
    size: '2.1GB',
    status: 'released',
  },
  {
    id: '3',
    pkg: 'com.miHoYo.GenshinImpact',
    title: '原神',
    shortDescription: '开放世界冒险 RPG。',
    description: '探索提瓦特大陆，收集角色并体验沉浸式剧情。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'anime open world rpg',
    category: 'RPG',
    rating: 4.9,
    downloads: '1亿',
    tags: ['开放世界', '冒险', '二次元'],
    developer: '米哈游',
    releaseDate: '2020-09-28',
    updateDate: '2026-03-18',
    screenshots: generateMockScreenshots('anime open world rpg'),
    version: '5.6.0',
    size: '15GB',
    status: 'released',
  },
  {
    id: '4',
    pkg: 'com.miHoYo.hkrpg',
    title: '崩坏：星穹铁道',
    shortDescription: '银河冒险回合制 RPG。',
    description: '乘坐星穹列车，探索不同文明与世界。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'space rail anime rpg',
    category: '策略 RPG',
    rating: 4.8,
    downloads: '8000万',
    tags: ['科幻', '回合制', '剧情'],
    developer: '米哈游',
    releaseDate: '2023-04-26',
    updateDate: '2026-03-18',
    screenshots: generateMockScreenshots('space rail anime rpg'),
    version: '3.2.0',
    size: '12GB',
    status: 'released',
  },
  {
    id: '5',
    pkg: 'com.kiloo.subwaysurf',
    title: '地铁跑酷',
    shortDescription: '经典无尽跑酷游戏。',
    description: '节奏明快，适合碎片化时间游玩。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'subway run game',
    category: '跑酷',
    rating: 4.5,
    downloads: '5亿',
    tags: ['休闲', '动作', '跑酷'],
    developer: 'SYBO Games',
    releaseDate: '2012-05-24',
    updateDate: '2026-03-10',
    screenshots: generateMockScreenshots('subway run game'),
    version: '3.18.0',
    size: '180MB',
    status: 'released',
  },
  {
    id: 'prereg-1',
    pkg: 'com.pocketpair.palworldmobile',
    title: '幻兽帕鲁 Mobile',
    shortDescription: '热门开放世界生存游戏移动版。',
    description: '收集、建造与战斗，多人玩法丰富。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'palworld mobile',
    category: '开放世界',
    tags: ['收集', '建造', '生存', '多人'],
    developer: 'Pocket Pair',
    status: 'pre-registration',
  },
];

const createGlobalExcerpt = (text: string, maxLength: number = 120): string => {
  if (!text) return '';
  const firstParagraph = text.split('\n\n')[0];
  if (firstParagraph.length <= maxLength) return firstParagraph;
  return `${firstParagraph.slice(0, maxLength)}...`;
};

export const MOCK_NEWS_ARTICLES: NewsArticle[] = MOCK_GAMES.slice(0, 5).flatMap((game, gameIndex) =>
  Array.from({ length: 2 }, (_, newsIndex) => {
    const id = `news-${game.id}-${newsIndex + 1}`;
    const title = `${game.title} ${newsIndex === 0 ? '版本速报' : '玩法攻略'} #${newsIndex + 1}`;
    const content = `这是关于《${game.title}》的资讯内容。\n\n本文聚焦最新版本变化、角色强度与实战建议，帮助玩家快速上手。\n\n${game.description}`;

    return {
      id,
      gameId: game.id,
      title,
      content,
      excerpt: createGlobalExcerpt(content, 140),
      imageUrl: 'https://placehold.co/600x400.png',
      dataAiHint: `${game.dataAiHint || 'game'} news`,
      category: newsIndex === 0 ? '版本更新' : '攻略解析',
      date: `2026-03-${String(20 - (gameIndex + newsIndex)).padStart(2, '0')}`,
      author: 'APKScc 编辑部',
      tags: [...(game.tags || []), newsIndex === 0 ? '更新' : '攻略'],
      isTop: newsIndex === 0,
      isRecommended: true,
      viewCount: 1000 + gameIndex * 130 + newsIndex * 77,
      likeCount: 80 + gameIndex * 9 + newsIndex * 6,
    };
  }),
);

export const MOCK_FORUM_SECTIONS: ForumSection[] = [
  { id: 'recommended', name: '推荐', icon: ThumbsUp, href: '/community/recommended', type: 'link' },
  { id: 'followed', name: '关注', icon: Heart, href: '/community/followed', type: 'link' },
  { id: 'general', name: '游戏综合区', icon: GameIcon, href: '/community/general', type: 'game' },
  {
    id: 'pubg',
    name: 'PUBG MOBILE',
    imageUrl: MOCK_GAMES.find((g) => g.pkg === 'com.tencent.ig')?.imageUrl || 'https://placehold.co/40x40.png',
    dataAiHint: 'pubg icon',
    href: '/community/pubg',
    type: 'game',
  },
  { id: 'apex', name: 'Apex Legends', imageUrl: 'https://placehold.co/40x40.png', dataAiHint: 'apex', href: '/community/apex', type: 'game' },
  { id: 'all-communities', name: '全部社区', icon: ChevronRight, href: '/community/all', type: 'action' },
];

export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post1',
    user: {
      name: '战术研究员',
      avatarUrl: 'https://placehold.co/40x40.png',
      dataAiHint: 'user avatar',
      level: 7,
      location: '江苏',
    },
    timestamp: '03-20 18:48',
    source: '来自 Web',
    title: 'PUBG 新版本落点与枪械搭配讨论',
    content: '欢迎交流跳点、转移路线和决赛圈思路。欢迎补充你的实战心得。',
    category: 'PUBG MOBILE',
    commentsCount: 16,
    likesCount: 43,
  },
  {
    id: 'post2',
    user: {
      name: '原神旅行者',
      avatarUrl: 'https://placehold.co/40x40.png',
      dataAiHint: 'user avatar',
      level: 5,
      location: '上海',
    },
    timestamp: '03-21 10:30',
    source: '来自 Android',
    title: '深渊配队分享：低练度也能满星',
    content: '整理了几套低成本队伍，包含圣遗物词条与循环手法。',
    imageUrl: 'https://placehold.co/600x300.png',
    imageAiHint: 'anime game scene',
    tags: ['原神', '深渊', '攻略'],
    category: '原神',
    commentsCount: 28,
    likesCount: 96,
  },
  {
    id: 'post3',
    user: {
      name: '星穹开拓者',
      avatarUrl: 'https://placehold.co/40x40.png',
      dataAiHint: 'user avatar',
      level: 6,
      location: '北京',
    },
    timestamp: '03-22 09:10',
    source: '来自 iOS',
    content: '2.0 版本卡池你们怎么抽？想听听大家对新角色强度的看法。',
    category: '崩坏：星穹铁道',
    commentsCount: 12,
    likesCount: 37,
  },
];

export const MOCK_SEARCH_HISTORY: string[] = ['原神', 'PUBG MOBILE', '版本更新', '攻略'];
