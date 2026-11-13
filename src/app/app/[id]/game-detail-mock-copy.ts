// 本模块集中存放来自 Stitch 视觉稿的硬编码文案与示例数据。
// 为什么单独成文件：这些内容目前没有对应的接口字段，先按视觉稿原样落地以保证版式完整；
// 后续接入真实数据源时只需替换本文件的取值，页面结构无需改动，同时也方便统一汇总与审查。
// 收录边界：只保留「版式装饰」与「站点级信任文案」——它们没有接口数据源，且与具体游戏无关；
// 游戏自身的介绍、FAQ、评价、帖子一律使用接口真实数据，避免把示例游戏的文案带到其它游戏页面上。
// 稿件来源：D:/APKSCC/.stitch/stitch-pc.html（PC：大画幅沉浸封面版）、D:/APKSCC/.stitch/stitch-mobile.html（移动端：TapTap 风格）。

export interface MockResourceLink {
  title: string;
  description: string;
  tone: string;
  icon: 'message' | 'card' | 'rocket';
}

// Hero 副信息与封面角标。
export const HERO_IN_APP_PURCHASE_NOTE = '包含应用内购买';
export const HERO_PLATFORM_NOTE = '国际服 / 需加速';

// 指标条兜底值：接口没有评分 / 评价数时用于撑住 Hero 指标条。
export const RATING_FALLBACK_SCORE = 4.4;
export const RATING_FALLBACK_COUNT = 124592;

// 稿件中的“系统要求 / 支持语言 / 安全签名校验”条目已移除：
// 系统要求改由接口真实字段 limit_android_version 提供（缺失时不展示），
// 支持语言没有数据源，安全校验没有对应集成——三者都不能按稿件写死展示。
// 真实的校验值覆盖由详情页的「资源校验值（SHA-256）」区块与首屏信任条展示。

// 「最新更新」的稿件兜底文案已删除（#219）：接口没有更新日志时，过去全站所有游戏
// 都渲染同一段示例游戏的更新日志，属于把示例内容冒充成真实更新。
// 现在没有真实 latest_content 就整块不渲染；versionLabel 只随真实内容一起出现。

// 侧栏“官方资源与外链服务”兜底条目：后台没有配置支持入口时使用。
export const OFFICIAL_RESOURCE_LINKS_FALLBACK: MockResourceLink[] = [
  { title: '国际服玩家交流 QQ 频道', description: '在线攻略 / 掉宝交流 / 组队连线', tone: 'bg-tone-blue/10 text-tone-blue border-tone-blue/25', icon: 'message' },
  { title: '谷歌礼品卡 / 官方充值支持', description: '官方正品代充 / 极速秒发点券', tone: 'bg-tone-amber/10 text-tone-amber border-tone-amber/25', icon: 'card' },
  { title: '国际服游戏专属加速工具', description: '降低延迟 Ping 值 / 告别掉线', tone: 'bg-tone-green/10 text-tone-green border-tone-green/25', icon: 'rocket' },
];

// 侧栏“官方纯净认证”卡已删除：原稿的安全扫描与“100% 官方分发”结论没有对应数据源与集成，
// 属于无证据承诺；现由 GameDetailView 内的数据驱动「资源校验信息」卡替代。

// 侧栏“官方盒子下载”卡。
export const BOX_DOWNLOAD_CARD = {
  title: '官方盒子下载',
  status: '稳定节点已激活',
  helper: '推荐下载 AC 盒子 | 安装器助手 | Google 环境全搞定！',
} as const;

// 移动端吸顶分类 Tab（稿件：详情 / 评价 / 攻略指南 / 社区动态）。
export const MOBILE_TABS = [
  { id: 'game-detail-section-overview', label: '详情' },
  { id: 'game-detail-section-reviews', label: '评价' },
  { id: 'game-detail-section-guides', label: '攻略指南' },
  { id: 'game-detail-section-community', label: '社区动态' },
] as const;

// 攻略指南区块标题右侧的说明文案。
export const GUIDE_SECTION_HINT = '新手与进阶问答';
