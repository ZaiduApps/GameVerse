/**
 * 动态路由段的形态校验（只覆盖审计点到的社区帖子 / 话题 / 用户 / 专辑四处）。
 *
 * 目的：把「参数形状明显不对」在发上游请求之前判掉。否则任何随机字符串都会：
 * 1) 向后端打一次必然失败的请求；2) 在带 revalidate 的 fetch 缓存里造一个永久条目。
 * 形状不符的调用方一律 notFound()，不渲染、也不发请求。
 */

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;
// 话题 slug 由后台按名称生成，线上同时存在「互联网精神」这类纯中文和「21937」这类纯数字，
// 因此按字符类放行汉字、字母、数字与 - _，只挡掉斜杠、空格、点号、控制字符等异常形态。
const TOPIC_SLUG_PATTERN = /^[\p{L}\p{N}_-]{1,100}$/u;
// 用户名既可能是普通用户名，也可能是邮箱（线上主键存在 zaidu9528@gmail.com 这种形态）。
const PROFILE_IDENTIFIER_PATTERN = /^[\p{L}\p{N}_.@+-]{1,128}$/u;

export function isObjectIdLike(value: string): boolean {
  return OBJECT_ID_PATTERN.test(String(value || '').trim());
}

/** 社区帖子主键是 Mongo ObjectId（后端 /content/public/:id）。 */
export function isCommunityPostId(value: string): boolean {
  return isObjectIdLike(value);
}

/** 话题动态段可以是 ObjectId，也可以是 slug。 */
export function isCommunityTopicIdentifier(value: string): boolean {
  const normalized = String(value || '').trim();
  return isObjectIdLike(normalized) || TOPIC_SLUG_PATTERN.test(normalized);
}

/** 用户动态段可以是 ObjectId、用户名或邮箱。 */
export function isPublicProfileIdentifier(value: string): boolean {
  const normalized = String(value || '').trim();
  return isObjectIdLike(normalized) || PROFILE_IDENTIFIER_PATTERN.test(normalized);
}

/** 专辑主键是 Mongo ObjectId（后端 app_albums._id）。 */
export function isAlbumIdentifier(value: string): boolean {
  return isObjectIdLike(value);
}

/**
 * 路由段可能以 percent-encoded 形态到达（例如 zaidu9528%40gmail.com）。
 * 解码失败说明是非法转义序列，返回 null 交由调用方 notFound()，
 * 避免 decodeURIComponent 直接抛 URIError 把页面打成 500。
 */
export function decodeRouteSegment(value: string): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!/%[0-9a-fA-F]{2}/.test(raw)) return raw;
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}
