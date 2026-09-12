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

export interface MockSimilarGame {
  name: string;
  meta: string;
}

// Hero 徽章行（稿件原文：官方正版 / 编辑精选 / 全新第4赛季）。真实标签不足 3 个时用于补位。
export const HERO_TRUST_BADGES = ['官方正版', '编辑精选', '全新第4赛季'] as const;

// Hero 副信息与封面角标。
export const HERO_IN_APP_PURCHASE_NOTE = '包含应用内购买';
export const HERO_PV_PILL = '实机 PV 01:24';
export const HERO_PLATFORM_NOTE = '国际服 / 需加速';

// 指标条兜底值：接口没有评分 / 评价数时用于撑住 Hero 指标条。
export const RATING_FALLBACK_SCORE = 4.4;
export const RATING_FALLBACK_COUNT = 124592;

// 技术参数宫格中，接口无法提供、按稿件补齐的条目。
export const TECH_SPEC_FILLERS = [
  { label: '最低系统要求', value: 'Android 8.0 或更高版本' },
  { label: '支持语言', value: '中文、英文、韩文、泰文' },
] as const;

// 稿件中的“安全签名校验”条目，渲染为绿色校验态。
export const SIGNATURE_VERIFY_TILE = { label: '安全签名校验', value: '官方原包·未篡改' } as const;

// 最新更新的兜底内容：接口没有更新日志时按稿件原文展示，保证区块不塌陷。
// 这是本文件里唯一与示例游戏强相关的一段文案，接入真实更新日志数据源后应优先移除。
export const WHATS_NEW_FALLBACK = {
  headline: '「天使破坏者」全新强力觉醒职业重磅登场！',
  bullets: [
    '新英雄与技能平衡：开放新职业「天使破坏者」，拥有强大的灵力脉冲炮击，同步优化全职业 PvE 输出数值曲线。',
    '夏日专属狂欢活动：参与热带海滩派对活动，赢取专属限定点装、高阶强化卷轴与传说级宠物。',
    '军团长讨伐新增难度：开放「困难级希纳斯女皇」团队副本，支持 10 人跨服组队征战。',
    '性能深度优化：修复了部分机型在后台切回时的偶发断线问题，全面降低大乱斗场景的发热与耗电。',
  ],
} as const;

// 侧栏“官方资源与外链服务”兜底条目：后台没有配置支持入口时使用。
export const OFFICIAL_RESOURCE_LINKS_FALLBACK: MockResourceLink[] = [
  { title: '国际服玩家交流 QQ 频道', description: '在线攻略 / 掉宝交流 / 组队连线', tone: 'bg-tone-blue/10 text-tone-blue border-tone-blue/25', icon: 'message' },
  { title: '谷歌礼品卡 / 官方充值支持', description: '官方正品代充 / 极速秒发点券', tone: 'bg-tone-amber/10 text-tone-amber border-tone-amber/25', icon: 'card' },
  { title: '国际服游戏专属加速工具', description: '降低延迟 Ping 值 / 告别掉线', tone: 'bg-tone-green/10 text-tone-green border-tone-green/25', icon: 'rocket' },
];

// 官方纯净认证卡（文案按视觉稿原文保留）。
export const CERTIFICATION_CARD = {
  title: 'APKScc 官方纯净认证',
  description:
    '经由 360 核心安全卫士与 VirusTotal 全面沙盒病毒扫描，无篡改、无暗扣插件，100% 提取自 Google Play 官方分发服务器。',
  chips: ['无恶意弹窗', '正版签名一致', '高速 CDN 节点'],
} as const;

// 侧栏“官方盒子下载”卡。
export const BOX_DOWNLOAD_CARD = {
  title: '官方盒子下载',
  status: '稳定节点已激活',
  helper: '无法安装？推荐下载 AC 盒子 | 安装器助手 | Google 环境全搞定！',
} as const;

// 没有真实推荐数据时的兜底相似游戏（无跳转链接，仅撑住侧栏版式）。
export const SIMILAR_GAMES_FALLBACK: MockSimilarGame[] = [
  { name: 'Toram Online (托兰异世录)', meta: 'MMORPG · 10M+' },
  { name: '刀剑神域：关键行动 (SAO)', meta: '3D ARPG · 5M+' },
  { name: 'Epic Seven (第七史诗)', meta: '回合制 RPG · 8M+' },
];

// 移动端吸顶分类 Tab（稿件：详情 / 评价 / 攻略指南 / 社区动态）。
export const MOBILE_TABS = [
  { id: 'game-detail-section-overview', label: '详情' },
  { id: 'game-detail-section-reviews', label: '评价' },
  { id: 'game-detail-section-guides', label: '攻略指南' },
  { id: 'game-detail-section-community', label: '社区动态' },
] as const;

// 攻略指南区块标题右侧的说明文案。
export const GUIDE_SECTION_HINT = '新手与进阶问答';

// 供质检脚本与维护者检索硬编码内容的来源标记。
export const MOCK_COPY_SOURCE = 'stitch-mock-copy';
