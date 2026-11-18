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
// 原来的两条写死文案（内购提示、区服加速提示）已删除：接口没有对应字段，
// 对所有游戏写死就是事实性断言，会误导用户（开源 GPL 软件也被标内购、源标记为开源的
// 也被宣称需要加速）。要展示必须由真实字段驱动，见 buildHeroMetrics。

// 指标条约定的取值来源只有接口字段：`star` / `reviewSummary.ratingCount` /
// `download_count_show` / `metadata.region`；缺失的格不渲染，不设兜底数值。

// 稿件中的“系统要求 / 支持语言 / 安全签名校验”条目已移除：
// 系统要求改由接口真实字段 limit_android_version 提供（缺失时不展示），
// 支持语言没有数据源，安全校验没有对应集成——三者都不能按稿件写死展示。
// 真实的校验值覆盖由详情页的「资源校验值（SHA-256）」区块与首屏信任条展示。

// 「最新更新」的稿件兜底文案已删除（#219）：接口没有更新日志时，过去全站所有游戏
// 都渲染同一段示例游戏的更新日志，属于把示例内容冒充成真实更新。
// 现在没有真实 latest_content 就整块不渲染；versionLabel 只随真实内容一起出现。

// 「官方资源与外链服务」的原稿件三条兜底（QQ 频道 / 礼品卡代充 / 加速工具）已删除：
// 后台没有配置支持入口时它们是纯广告文案，且无真实链接。现在没有真实 cardConfig 条目
// 就整块不渲染，配色与图标按条目的真实序号轮换，不再借兜底数组取色。

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
