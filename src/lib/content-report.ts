import { buildFeedbackCommonFields } from '@/lib/feedback';

/**
 * 内容举报的提交口径：复用现有反馈工单接口（POST /feedbacks），
 * 不新建后台页面。类型取 content_report（interface 侧已加入枚举与「内容举报」标签），
 * target_id 记录被举报对象，ref_url 记录提交页面，便于运营回查。
 */

export const CONTENT_REPORT_REASONS = [
  { value: 'illegal', label: '违法违规' },
  { value: 'infringement', label: '侵权' },
  { value: 'invalid', label: '内容失效' },
  { value: 'spam', label: '垃圾广告' },
  { value: 'other', label: '其他' },
] as const;

export type ContentReportReason = (typeof CONTENT_REPORT_REASONS)[number]['value'];
export type ContentReportTargetType = 'post' | 'comment' | 'resource';

const TARGET_TYPE_LABELS: Record<ContentReportTargetType, string> = {
  post: '帖子',
  comment: '评论',
  resource: '资源',
};

export interface ContentReportInput {
  targetType: ContentReportTargetType;
  targetId: string;
  reason: ContentReportReason;
  /** 可选补充说明 */
  note?: string;
  /** 当前页面地址；缺省时取 window.location.href */
  refUrl?: string;
  user?: {
    _id?: string;
    email?: string;
    name?: string;
    username?: string;
  } | null;
}

export function describeContentReportTarget(targetType: ContentReportTargetType): string {
  return TARGET_TYPE_LABELS[targetType] || '内容';
}

/** 未知原因一律落到「其他」，避免脏值让工单无法分类。 */
export function resolveContentReportReason(value: unknown): (typeof CONTENT_REPORT_REASONS)[number] {
  const raw = String(value ?? '').trim();
  return (
    CONTENT_REPORT_REASONS.find((item) => item.value === raw) ??
    CONTENT_REPORT_REASONS[CONTENT_REPORT_REASONS.length - 1]
  );
}

export function buildContentReportPayload(input: ContentReportInput): Record<string, unknown> {
  const targetId = String(input.targetId || '').trim();
  const targetLabel = describeContentReportTarget(input.targetType);
  const reason = resolveContentReportReason(input.reason);
  const note = String(input.note || '').trim();
  const common = buildFeedbackCommonFields(input.user || undefined, input.refUrl);

  return {
    ...common,
    type: 'content_report',
    target_id: targetId,
    ref_url: input.refUrl || common.ref_url,
    title: `内容举报：${targetLabel}`,
    description: [
      `举报对象：${targetLabel}（${input.targetType}）`,
      `对象 ID：${targetId || '未提供'}`,
      `举报原因：${reason.label}`,
      `补充说明：${note || '无'}`,
      `提交入口：Web 内容举报`,
      `提交用户：${common.nickname || '游客'}`,
      `联系方式：${common.contact || '未提供'}`,
    ].join('\n'),
  };
}
