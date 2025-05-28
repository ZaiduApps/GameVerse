
import type { Game, NewsArticle, ForumSection, CommunityPost } from '@/types';
import { Heart, ThumbsUp, Gamepad2 as GameIcon, ChevronRight, MessageCircle, Users, Image as ImageIcon, Video, Smile, AtSign, Hash } from 'lucide-react';

const generateMockScreenshots = (gameTitleHint: string, count: number = 5): Game['screenshots'] => {
  return Array.from({ length: count }, (_, i) => ({
    url: `https://placehold.co/400x225.png`, // 16:9 aspect ratio
    dataAiHint: `${gameTitleHint} gameplay ${i + 1}`,
  }));
};

export const MOCK_GAMES: Game[] = [
  {
    id: '1',
    title: '王者荣耀',
    shortDescription: '腾讯天美工作室群开发的MOBA手游大作。',
    description: '《王者荣耀》是腾讯天美工作室群开发并运行的一款运营在Android、IOS、NS平台上的MOBA类手机游戏，于2015年11月26日在Android、IOS平台上正式公测。游戏以竞技对战为主，玩家之间进行1V1、3V3、5V5等多种方式的PVP对战，还可以参加游戏的冒险模式，进行PVE的闯关模式，在满足条件后可以参加游戏的排位赛等，是属于推塔类型的游戏。',
    imageUrl: `https://placehold.co/300x300.png`, // Changed to square for game icons
    dataAiHint: 'fantasy battle king',
    category: 'MOBA',
    rating: 4.8,
    downloads: '2亿+',
    tags: ['竞技', '团队', '策略'],
    developer: '腾讯天美',
    releaseDate: '2015年11月26日',
    updateDate: '2024年07月15日',
    screenshots: generateMockScreenshots('fantasy battle king'),
    version: '3.2.1',
    size: '1.8GB'
  },
  {
    id: '2',
    title: '和平精英',
    shortDescription: '光子工作室群自研打造的军事竞赛体验手游。',
    description: '《和平精英》是由腾讯光子工作室群自研打造的反恐军事竞赛体验类型的国产手游，该作于2019年5月8日正式公测。游戏采用虚幻4引擎研发，致力于从画面、地图、射击手感等多个层面，为玩家全方位打造出极具真实感的军事竞赛体验。',
    imageUrl: `https://placehold.co/300x300.png`,
    dataAiHint: 'battle royale pubg',
    category: '射击',
    rating: 4.7,
    downloads: '1.5亿+',
    tags: ['战术', '生存', '射击'],
    developer: '腾讯光子',
    releaseDate: '2019年05月08日',
    updateDate: '2024年07月10日',
    screenshots: generateMockScreenshots('battle royale shooting pubg'),
    version: '2.5.0',
    size: '2.1GB'
  },
  {
    id: '3',
    title: '原神',
    shortDescription: '米哈游研发的开放世界冒险RPG。',
    description: '《原神》是由上海米哈游制作发行的一款开放世界冒险游戏，于2020年9月28日开启公测。游戏发生在一个被称作「提瓦特」的幻想世界，在这里，被神选中的人将被授予「神之眼」，导引元素之力。玩家将扮演一位名为「旅行者」的神秘角色，在自由的旅行中邂逅性格各异、能力独特的同伴们，和他们一起击败强敌，找回失散的亲人——同时，逐步发掘「原神」的真相。',
    imageUrl: `https://placehold.co/300x300.png`,
    dataAiHint: 'anime adventure genshin',
    category: 'RPG',
    rating: 4.9,
    downloads: '1亿+',
    tags: ['开放世界', '动漫', '冒险'],
    developer: '米哈游',
    releaseDate: '2020年09月28日',
    updateDate: '2024年07月18日',
    screenshots: generateMockScreenshots('anime world exploration genshin'),
    version: '4.7',
    size: '15GB'
  },
  {
    id: '4',
    title: '崩坏：星穹铁道',
    shortDescription: '米哈游最新银河冒险策略游戏。',
    description: '《崩坏：星穹铁道》是米哈游自研的全新银河冒险策略游戏。你将由此探索新的文明，结识新的伙伴，在无数光怪陆离的「世界」与「世界」之间展开新的冒险。所有你想知道的，都将在群星中找到答案。那么，准备好开始这段「开拓」之旅了吗？',
    imageUrl: `https://placehold.co/300x300.png`,
    dataAiHint: 'sci-fi train star rail',
    category: '策略 RPG',
    rating: 4.8,
    downloads: '8000万+',
    tags: ['科幻', '回合制', '策略'],
    developer: '米哈游',
    releaseDate: '2023年04月26日',
    updateDate: '2024年07月12日',
    screenshots: generateMockScreenshots('sci-fi space train star rail'),
    version: '2.3',
    size: '12GB'
  },
  {
    id: '5',
    title: '地铁跑酷',
    shortDescription: '经典的无尽跑酷游戏，躲避检查员和他的狗。',
    description: '《地铁跑酷》是一款由SYBO Games开发的跑酷游戏，背景设定在地铁铁轨上，玩家要帮助Jake和淘气的小伙伴们躲避警察的追捕，同时往来的地铁给游戏增加了挑战难度。游戏画面可爱精致，色彩繁多让人感觉很舒服，在操作上非常顺畅，并且干净利落。',
    imageUrl: `https://placehold.co/300x300.png`,
    dataAiHint: 'subway run character',
    category: '跑酷',
    rating: 4.5,
    downloads: '5亿+',
    tags: ['休闲', '动作', '跑酷'],
    developer: 'SYBO Games',
    releaseDate: '2012年05月24日',
    updateDate: '2024年06月20日',
    screenshots: generateMockScreenshots('urban subway runner game'),
    version: '3.18.0',
    size: '150MB'
  },
  {
    id: '6',
    title: '蛋仔派对',
    shortDescription: '网易研发的潮玩休闲竞技游戏。',
    description: '《蛋仔派对》是一款潮玩题材的休闲竞技游戏，在这里你将化身Q萌蛋仔，加入热闹非凡的闯关派对。海量丰富的关卡，险象环生的陷阱机关，争先恐后往前冲！奔跑、跳跃、翻滚，发生超真实的物理碰撞！百变外观任你搭配，潮流、酷炫、萌趣的盲盒等你收入囊中！更有零门槛地图编辑器，DIY你的专属关卡！',
    imageUrl: `https://placehold.co/300x300.png`,
    dataAiHint: 'cute party egg',
    category: '休闲竞技',
    rating: 4.6,
    downloads: '9000万+',
    tags: ['派对', '可爱', '竞技'],
    developer: '网易游戏',
    releaseDate: '2022年05月27日',
    updateDate: '2024年07月05日',
    screenshots: generateMockScreenshots('party game obstacle course'),
    version: '1.0.111',
    size: '1.2GB'
  },
];

const createGlobalExcerpt = (text: string, maxLength: number = 120): string => {
  if (!text) return '';
  const firstParagraph = text.split('\n\n')[0];
  if (firstParagraph.length <= maxLength) return firstParagraph;
  
  let cutPoint = -1;
  const punctuation = ['。', '！', '？', '.', '!', '?'];
  for (const p of punctuation) {
    const point = firstParagraph.lastIndexOf(p, maxLength);
    if (point > cutPoint) {
      cutPoint = point;
    }
  }

  if (cutPoint === -1 || cutPoint < maxLength / 3) { // Prefer space if no good punctuation found early
    cutPoint = firstParagraph.lastIndexOf(' ', maxLength);
  }

  if (cutPoint === -1 || cutPoint < maxLength / 3) { // Fallback to hard cut
    return firstParagraph.substring(0, maxLength) + '...';
  }
  return firstParagraph.substring(0, cutPoint + 1) + '...';
};


export const MOCK_NEWS_ARTICLES: NewsArticle[] = MOCK_GAMES.flatMap((game, gameIndex) =>
  Array.from({ length: Math.max(1, (MOCK_GAMES.length - gameIndex) * 2) }, (_, newsIndex) => { // More news overall
    const newsId = `news-${game.id}-${newsIndex + 1}`;
    const baseTitle = newsIndex === 0 ? '最新动态与攻略分享' : 
                      newsIndex === 1 ? '深度评测解析' : 
                      newsIndex === 2 ? '社区精彩活动' : 
                      `版本前瞻 ${newsIndex}`;
    const title = `${game.title} ${baseTitle} #${newsIndex + 1}`;
    
    const content = `这是关于《${game.title}》的第 ${newsIndex + 1} 篇资讯。主题：${baseTitle}。
深入探讨了其最新更新、社区热点以及一些高级游戏技巧。例如，在《${game.title}》中，玩家可以体验到${game.shortDescription}
本文还会讨论关于《${game.title}》的${game.tags?.join('、')}等特色。
${game.description}
更多详细内容，包括最新的角色介绍、活动预告以及玩家社区的精彩讨论，都将在这里为您呈现。我们致力于提供最全面、最及时的游戏资讯，帮助您更好地享受《${game.title}》带来的乐趣。
敬请期待后续的独家报道和深度评测！别忘了关注我们的${game.developer}团队。
`;

    return {
      id: newsId,
      gameId: game.id,
      title: title,
      content: content,
      excerpt: createGlobalExcerpt(content, 150),
      imageUrl: `https://placehold.co/600x400.png`, // News articles should use typical banner images
      dataAiHint: game.dataAiHint ? `${game.dataAiHint} news ${newsIndex + 1}` : `news article ${newsIndex + 1}`,
      category: newsIndex % 4 === 0 ? '游戏攻略' : newsIndex % 4 === 1 ? '行业新闻' : newsIndex % 4 === 2 ? '深度评测' : '最新动态',
      date: `2024年${Math.max(1, 7 - (gameIndex % 6))}月${Math.min(28, 5 + newsIndex + gameIndex)}日`,
      author: '游戏宇宙编辑部',
      tags: game.tags ? [...game.tags, (newsIndex % 3 === 0 ? '热门' : '深度分析'), `资讯系列${newsIndex+1}`] : [`资讯系列${newsIndex+1}`],
    };
  })
);


export const MOCK_FORUM_SECTIONS: ForumSection[] = [
  { id: 'followed', name: '关注', icon: Heart, href: '/community/followed', type: 'link' },
  { id: 'recommended', name: '推荐', icon: ThumbsUp, href: '/community/recommended', type: 'link' },
  { 
    id: 'general', 
    name: '游戏综合区', 
    icon: GameIcon, // Generic game icon
    href: '/community/general', 
    type: 'game' 
  },
  { 
    id: 'pubg', 
    name: '绝地求生', 
    imageUrl: MOCK_GAMES.find(g => g.title === '和平精英')?.imageUrl || `https://placehold.co/40x40.png`, // Placeholder for specific game icon
    dataAiHint: MOCK_GAMES.find(g => g.title === '和平精英')?.dataAiHint || 'battle royale',
    href: '/community/pubg', 
    type: 'game' 
  },
  { 
    id: 'apex', 
    name: 'Apex Legends', 
    imageUrl: `https://placehold.co/40x40.png`, 
    dataAiHint: 'sci-fi shooter',
    href: '/community/apex', 
    type: 'game' 
  },
  { 
    id: 'superpeople', 
    name: '超击突破2', 
    imageUrl: `https://placehold.co/40x40.png`, 
    dataAiHint: 'superhero battle',
    href: '/community/superpeople', 
    type: 'game' 
  },
  { id: 'all-communities', name: '全部社区', icon: ChevronRight, href: '/community/all', type: 'action' },
];

export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post1',
    user: {
      name: 'olatu-jeff',
      avatarUrl: 'https://placehold.co/40x40.png',
      dataAiHint: 'user avatar',
      level: 7,
      location: '江苏',
    },
    timestamp: '5-26 18:48',
    source: '来自web',
    title: 'PUBG公会欢迎各位兄弟的加入！！！',
    content: `PUBG公会欢迎各位兄弟的加入！！！
1-B级公会: olatutech 在线秒批！！！---公会标签: H3RO Lv.12级
2-S级公会: OLATU 在线秒批！！！---公会标签: H3RO 等级: Lv.16级
3-S级公会: VAMD 在线秒批！！！---公会标签: H3RO 等级: Lv.18级
要求活跃度高 长在线 欢迎加入。。。`,
    category: '绝地求生',
    commentsCount: 0,
    likesCount: 1,
  },
  {
    id: 'post2',
    user: {
      name: '游戏小能手',
      avatarUrl: 'https://placehold.co/40x40.png',
      dataAiHint: 'gamer avatar',
      level: 5,
      location: '上海',
    },
    timestamp: '5-27 10:30',
    source: '来自Android',
    title: '《原神》新活动攻略分享',
    content: `这次《原神》的新活动太给力了！我花了一晚上整理出来的攻略，希望能帮到大家。
主要难点在于第三阶段的Boss战，建议带上冰系和雷系角色。
详细的队伍配置和打法技巧见长文，欢迎讨论！`,
    imageUrl: 'https://placehold.co/600x300.png',
    imageAiHint: 'anime game scene',
    tags: ['原神', '攻略', '新活动'],
    category: '原神',
    commentsCount: 12,
    likesCount: 35,
  },
  {
    id: 'post3',
    user: {
      name: '王者大神',
      avatarUrl: 'https://placehold.co/40x40.png',
      dataAiHint: 'user avatar pro',
      level: 10,
      location: '北京',
    },
    timestamp: '5-27 12:15',
    source: '来自iOS',
    content: `兄弟们，新赛季上分用什么英雄好？求推荐！
感觉现在的版本节奏好快，我常用的几个英雄有点跟不上了。
目前段位星耀，主玩打野和射手。`,
    category: '王者荣耀',
    commentsCount: 25,
    likesCount: 8,
  },
  {
    id: 'post4',
    user: {
      name: '休闲玩家小李',
      avatarUrl: 'https://placehold.co/40x40.png',
      dataAiHint: 'casual gamer',
      level: 3,
    },
    timestamp: '5-27 14:00',
    source: '来自web',
    title: '蛋仔派对组队吗？来个会玩的！',
    content: `蛋仔派对新出的地图太好玩了，但是一个人玩有点孤单，有没有一起组队的？
要求不高，别太坑就行，欢乐为主！在线等！我的ID是：小李闯天关`,
    category: '蛋仔派对',
    commentsCount: 5,
    likesCount: 2,
  },
];
