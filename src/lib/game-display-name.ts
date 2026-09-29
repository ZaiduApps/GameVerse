/**
 * 游戏展示名解析。
 *
 * 站内 name 存的是 Google Play 原名（多为外文），运营在后台维护的
 * 多语言名在 metadata.chs / cht / en。前端过去只渲染 name，导致
 * 首页、搜索、游戏库、详情页显示的都是外文原名，和后台编辑结果对不上。
 *
 * 这里统一按语种取值，取不到就逐级回退，最后退到 name、再退到包名，
 * 保证任何数据形态（社区 app_info 精简字段、搜索结果、历史脏数据）
 * 都不会渲染出空白。
 */

export const GAME_NAME_LOCALES = ['zh-CN', 'zh-TW', 'en'] as const;

export type GameNameLocale = (typeof GAME_NAME_LOCALES)[number];

/** 允许的入参形态：列表/详情/搜索/社区的字段完整度不一，全部按可选处理。 */
export type GameDisplayNameSource = {
  name?: null | string;
  pkg?: null | string;
  metadata?: null | {
    chs?: null | string;
    cht?: null | string;
    en?: null | string;
    // 不同来源（详情页、搜索、社区 app_info）下发的 metadata 字段并不一致，
    // 这里带索引签名，缺字段不会被 TypeScript 的弱类型检测判成不兼容。
  } & Record<string, unknown>;
};

/** 各语种对应的 metadata 字段，按回退优先级排列。 */
const LOCALE_METADATA_KEYS: Record<GameNameLocale, ('chs' | 'cht' | 'en')[]> = {
  'en': ['en', 'chs', 'cht'],
  'zh-CN': ['chs', 'cht', 'en'],
  'zh-TW': ['cht', 'chs', 'en'],
};

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * 取游戏在指定语种下的展示名。
 *
 * 回退链：当前语种 → 简体 → 繁体 → 英文 → Google Play 原名 → 包名。
 * 站点目前没有 i18n，默认 zh-CN（后台维护的默认中文名）。
 */
export function resolveGameName(
  game: GameDisplayNameSource | null | undefined,
  locale: GameNameLocale = 'zh-CN',
): string {
  if (!game) return '';

  const metadata = game.metadata || {};
  const keys = LOCALE_METADATA_KEYS[locale] || LOCALE_METADATA_KEYS['zh-CN'];
  for (const key of keys) {
    const value = readText(metadata[key]);
    if (value) return value;
  }

  return readText(game.name) || readText(game.pkg);
}
