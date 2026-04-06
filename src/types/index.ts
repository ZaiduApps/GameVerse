
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
  id: string; // was _id or gid from api
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
  isTop?: boolean;
  isRecommended?: boolean;
  viewCount?: number;
  likeCount?: number;
  additionLinks?: string[];
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
  summary?: string;
  content: string;
  imageUrl?: string; // Optional image in the post
  imageAiHint?: string;
  tags?: string[];
  topicIds?: string[];
  topicNames?: string[];
  category?: string; // e.g., "游戏综合区"
  commentsCount: number;
  likesCount: number;
  viewsCount?: number;
  isTop?: boolean;
  isRecommended?: boolean;
  relatedApp?: {
    id?: string;
    name: string;
    pkg?: string;
    icon?: string;
    summary?: string;
    regionTag?: string;
    tags?: string[];
  };
}

export interface SearchResult {
    id: string;
    title: string;
    type: 'game' | 'article' | 'post';
    category: string;
    imageUrl: string;
    rating?: number;
    pkg?: string;
    region?: string;
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
  gid?: string; // new field for news linking
  name: string;
  summary: string;
  image_cover: string;
  release_at: string;
  source: string;
  author: string;
  tags: string[];
  content?: string;
  is_top?: boolean;
  is_recommended?: boolean;
  view_counts?: number;
  like_counts?: number;
  addition_links?: string[];
}

export interface HomeData {
  banner: ApiBanner[];
  albums: ApiAlbum[];
  articles: ApiArticle[];
  dynamic_posts?: ApiDynamicPost[];
  announcements?: HomeAnnouncements;
}

export interface ApiDynamicPost {
  _id: string;
  post_type?: string;
  title?: string;
  summary?: string;
  cover?: string;
  publish_at?: string;
  last_commented_at?: string;
  like_count?: number;
  comment_count?: number;
  author_name?: string;
  author_avatar?: string;
  app_id?: string;
  app_info?: {
    _id?: string;
    name?: string;
    pkg?: string;
    icon?: string;
    summary?: string;
    tags?: string[];
  };
}

export interface HomeAnnouncements {
  popup?: Announcement[];
  normal?: Announcement[];
  marquee?: Announcement[];
  [key: string]: Announcement[] | undefined;
}

// Detail Page API Types
export interface ApiGameDetail {
  _id: string;
  name: string;
  pkg: string;
  type: string;
  description: string;
  summary: string;
  download_count_show: string;
  star: number;
  icon: string;
  detail_images: string[];
  header_image: string;
  developer: string;
  latest_at: string;
  release_at: string | null;
  tags: string[];
  version: string;
  file_size: number | null;
  metadata: {
    region: string;
  };
}

export interface ApiDownloadResource {
  _id: string;
  channel_id?: string;
  platform_range?: string[] | string;
  platform_ranges?: string[] | string;
  channel: {
    _id: string;
    name: string;
    icon: string;
    code: string;
    description?: string;
    platform_range?: string[] | string;
    platform_ranges?: string[] | string;
  };
}

// New types for Game Detail Page
export interface Announcement {
  _id: string;
  title: string;
  content: string;
  summary?: string;
  type: "popup" | "marquee" | "normal" | "system";
  position: string[];
  style?: {
    theme?: "info" | "warning" | "success" | "error";
    color?: string;
    icon?: string;
  };
  link?: {
    type: "inner" | "outer";
    url: string;
  };
  closeable?: boolean;
  once_per_user?: boolean;
}

export interface CardConfigItem {
  _id: string;
  content: {
    title: string;
    link?: string;
    icon?: string;
    color?: string;
    text?: string;
    html?: string;
  };
}

export interface GameDetailData {
  app: ApiGameDetail;
  resources: ApiDownloadResource[];
  Announcements?: {
    popup?: Announcement[];
    normal?: Announcement[];
    marquee?: Announcement[];
    system?: Announcement[];
  };
  announcements?: {
    popup?: Announcement[];
    normal?: Announcement[];
    marquee?: Announcement[];
    system?: Announcement[];
  };
  cardConfig?: {
    contact?: CardConfigItem[];
    download_notice?: CardConfigItem[];
    partner?: CardConfigItem[];
  };
}


export interface ApiRecommendedGame {
  _id: string;
  name: string;
  pkg: string;
  summary: string;
  star: number;
  icon: string;
  match_score: number;
  tags: {
    id: string;
    name: string;
  }[];
}


// New type for Global Site Configuration
export interface SiteConfig {
  key?: string;
  _id?: string;
  basic?: {
    site_name: string;
    site_slogan: string;
    logo_url: string;
    favicon_url: string;
    share_image: string;
  };
  header?: {
    verifications: {
      baidu?: string;
      google?: string;
      q360?: string;
      sogou?: string;
    };
    other?: { [key: string]: string };
    custom_css?: string;
    head_scripts?: string;
  };
  seo?: {
    title_suffix: string;
    keywords: string;
    description: string;
  };
  footer?: {
    copyright: string;
    icp_number?: string;
    footer_text: string;
    footer_scripts?: string;
  };
  friend_links?: {
    name: string;
    url: string;
    sort: number;
  }[];
  quick_links?: {
    group_name: string;
    links: {
      _id?: string | { $oid?: string };
      name: string;
      url: string;
      sort: number;
    }[];
  }[];
  app_seo?: {
    app_title_template: string;
    app_description_template: string;
  };
  is_active?: boolean;
  is_maintenance?: boolean;
}

// User & Auth Types
export interface User {
  _id: string;
  username: string;
  email: string;
  name?: string;
  avatar?: string;
  isActive: boolean;
  roles: (string | { name: string; code?: string; [key: string]: any })[];
  loginCount?: number;
  lastLoginTime?: string;
  lastLoginIp?: string;
  lastLoginCity?: string;
  lastLoginDeviceId?: string;
  lastLoginDeviceName?: string;
  lastLoginUserAgent?: string;
  loginIpHistory?: string[];
  loginDeviceIds?: string[];
  created_at?: string;
  updated_at?: string;
  gender?: string;
  phone?: string;
  birthday?: string;
  country?: string;
  province?: string;
  city?: string;
  isVerified?: boolean;
}

export interface AuthData {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
