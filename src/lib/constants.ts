
import type { Game, NewsArticle, ForumSection, CommunityPost, SearchResult } from '@/types';
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
    pkg: 'com.tencent.tmgp.sgame',
    title: '王者荣耀',
    shortDescription: '腾讯天美工作室群开发的MOBA手游大作。',
    description: '《王者荣耀》是腾讯天美工作室群开发并运行的一款运营在Android、IOS、NS平台上的MOBA类手机游戏，于2015年11月26日在Android、IOS平台上正式公测。游戏以竞技对战为主，玩家之间进行1V1、3V3、5V5等多种方式的PVP对战，还可以参加游戏的冒险模式，进行PVE的闯关模式，在满足条件后可以参加游戏的排位赛等，是属于推塔类型的游戏。',
    imageUrl: `https://placehold.co/300x300.png`,
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
    size: '1.8GB',
    status: 'released',
  },
  {
    id: '2',
    pkg: 'com.tencent.ig',
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
    size: '2.1GB',
    status: 'released',
  },
  {
    id: '3',
    pkg: 'com.mihoyo.genshinimpact',
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
    size: '15GB',
    status: 'released',
  },
  {
    id: '4',
    pkg: 'com.mihoyo.honkaistarrail',
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
    size: '12GB',
    status: 'released',
  },
  {
    id: '5',
    pkg: 'com.kiloo.subwaysurf',
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
    size: '150MB',
    status: 'released',
  },
  {
    id: '6',
    pkg: 'com.netease.party',
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
    size: '1.2GB',
    status: 'released',
  },
  {
    id: 'prereg-1',
    pkg: 'com.pocketpair.palworldmobile',
    title: '幻兽帕鲁 Mobile',
    shortDescription: '现象级大作移动版即将登场。',
    description: '期待已久的《幻兽帕鲁 Mobile》即将开启事前登录！捕捉、建造、战斗，与帕鲁们一起在广阔的世界中冒险！移动端专属优化，随时随地畅享帕鲁的奇妙乐趣。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'palworld mobile game',
    category: '开放世界',
    tags: ['收集', '建造', '冒险', '多人'],
    developer: 'Pocket Pair, Inc.',
    status: 'pre-registration',
  },
  {
    id: 'prereg-2',
    pkg: 'com.netease.projectinfinite',
    title: '代号：无限大',
    shortDescription: '都市题材开放世界RPG。',
    description: '由网易Naked Rain工作室打造的都市题材开放世界RPG《代号：无限大》即将开启事前登录。探索充满未知的都市，揭开层层谜团。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'urban open world',
    category: 'RPG',
    tags: ['都市', '开放世界', '科幻'],
    developer: '网易Naked Rain',
    status: 'pre-registration',
  },
  {
    id: 'prereg-3',
    pkg: 'com.thunderfire.projectmugen',
    title: 'Project Mugen',
    shortDescription: '都市超自然题材开放世界RPG。',
    description: '《Project Mugen》是一款都市超自然题材的开放世界角色扮演游戏。玩家将扮演代号为“无限扳机”的超自然现象调查员，在繁华都市中穿梭，应对各种异常事件。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'urban supernatural rpg',
    category: 'RPG',
    tags: ['都市', '超自然', '开放世界'],
    developer: 'Thunder Fire Studio',
    status: 'pre-registration',
  },
   {
    id: 'prereg-4',
    pkg: 'com.netease.marvelrivals',
    title: 'MARVEL Rivals',
    shortDescription: '漫威英雄6v6团队射击游戏。',
    description: '《MARVEL Rivals》是一款由网易游戏与漫威游戏合作开发的超级英雄题材第三人称团队PVP射击游戏。集结全明星阵容的漫威超级英雄和超级反派，在动态的、可破坏的漫威宇宙多元宇宙世界中进行激烈的6v6战斗。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'marvel team shooter',
    category: '射击',
    tags: ['漫威', '团队PVP', '超级英雄'],
    developer: '网易游戏 & 漫威游戏',
    status: 'pre-registration',
  },
  {
    id: '7',
    pkg: 'com.hypergryph.arknights',
    title: '明日方舟',
    description: '探索泰拉世界的策略塔防游戏。',
    shortDescription: '策略塔防，末世方舟。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'arknights anime strategy',
    category: '策略塔防',
    rating: 4.7,
    downloads: '5000万+',
    status: 'released',
    tags: ['塔防', '策略', '二次元'],
  },
  {
    id: '8',
    pkg: 'com.riotgames.league.wildrift',
    title: '英雄联盟手游',
    description: '经典MOBA的移动版本。',
    shortDescription: '峡谷再现，指尖激战。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'league legends mobile',
    category: 'MOBA',
    rating: 4.6,
    downloads: '1亿+',
    status: 'released',
    tags: ['竞技', 'MOBA', '策略'],
  },
  {
    id: '9',
    pkg: 'com.tencent.tft',
    title: '金铲铲之战',
    description: '英雄联盟云顶之弈正版授权。',
    shortDescription: '策略自走棋，弈决高下。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'tft mobile autochess',
    category: '自走棋',
    rating: 4.5,
    downloads: '7000万+',
    status: 'released',
    tags: ['策略', '自走棋', '休闲'],
  },
  {
    id: '10',
    pkg: 'com.thatgamecompany.sky',
    title: '光·遇',
    description: '温暖的灵魂终将相遇。',
    shortDescription: '治愈系冒险社交游戏。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'sky children light',
    category: '冒险社交',
    rating: 4.9,
    downloads: '6000万+',
    status: 'released',
    tags: ['治愈', '社交', '冒险'],
  },
  {
    id: 'prereg-5',
    pkg: 'com.perfectworld.zhuxian',
    title: '诛仙世界',
    shortDescription: '经典IP开放世界MMORPG。',
    description: '《诛仙世界》是完美世界游戏开发的仙侠沙盒MMORPG。游戏基于UE5引擎，致力于打造一个广阔、真实的仙侠世界。事前登录即将开启！',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'zhuxian mmorpg openworld',
    category: 'MMORPG',
    tags: ['仙侠', '开放世界', '沙盒'],
    developer: '完美世界游戏',
    status: 'pre-registration',
  },
  {
    id: 'prereg-6',
    pkg: 'com.everstone.yysls',
    title: '燕云十六声',
    shortDescription: '国产武侠开放世界动作游戏。',
    description: '《燕云十六声》是一款由EVERSTONE自研的国产武侠开放世界动作游戏。游戏设定在五代十国时期，玩家将扮演一名身怀绝技的侠客，在乱世中闯荡。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'wuxia openworld action',
    category: '动作RPG',
    tags: ['武侠', '开放世界', '动作'],
    developer: 'EVERSTONE Studio',
    status: 'pre-registration',
  },
  {
    id: 'prereg-7',
    pkg: 'com.ldzy.taris',
    title: '塔瑞斯世界',
    shortDescription: '硬核开荒MMORPG。',
    description: '《塔瑞斯世界》是一款由乐动卓越开发的跨端硬核开荒MMORPG。游戏致力于打造一个纯粹、公平的MMORPG体验，回归经典副本开荒乐趣。',
    imageUrl: 'https://placehold.co/300x300.png',
    dataAiHint: 'tarisland mmorpg hardcore',
    category: 'MMORPG',
    tags: ['硬核', '副本', 'MMORPG'],
    developer: '乐动卓越',
    status: 'pre-registration',
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
      author: 'Apks.cc编辑部',
      tags: game.tags ? [...game.tags, (newsIndex % 3 === 0 ? '热门' : '深度分析'), `资讯系列${newsIndex+1}`] : [`资讯系列${newsIndex+1}`],
    };
  })
);


export const MOCK_FORUM_SECTIONS: ForumSection[] = [
  { id: 'recommended', name: '推荐', icon: ThumbsUp, href: '/community/recommended', type: 'link' },
  { id: 'followed', name: '关注', icon: Heart, href: '/community/followed', type: 'link' },
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


// Mock Data for Search Overlay
export const MOCK_SEARCH_HISTORY: string[] = ['原神', '和平精英', '新版本', '攻略'];
