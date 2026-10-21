// Hero「实机 PV」的源解析：接口字段是 GP 抓取/运营上传的混合媒体地址，
// 三种形态（自托管 mp4、YouTube 嵌入、GP 抓取残留的失效 .bin）必须在前端先分拣，
// 解析不出可播放源就返回 null，页面不渲染 PV 入口——不做占位视频，也不猜时长。
// 纯函数、无 import：服务端组件与 node 测试都可直接使用。

export type HeroVideoSource =
  | { kind: 'file'; url: string }
  | { kind: 'embed'; provider: 'youtube'; url: string };

export interface HeroVideoView {
  source: HeroVideoSource;
  poster?: string;
}

interface HeroVideoInput {
  video_preview?: string | null;
  video_image?: string | null;
}

// 浏览器能直接播放的容器；未列出的后缀（例如失效的 .bin）无法判断，按无效处理。
const VIDEO_EXTENSIONS: Record<string, true> = { '.mp4': true, '.webm': true, '.mov': true, '.m4v': true, '.ogv': true };
const IMAGE_EXTENSIONS: Record<string, true> = { '.webp': true, '.jpg': true, '.jpeg': true, '.png': true, '.avif': true, '.gif': true };
const YOUTUBE_PATH_KINDS: Record<string, true> = { embed: true, v: true, shorts: true, live: true };
const YOUTUBE_HOSTS: Record<string, true> = { 'youtube.com': true, 'www.youtube.com': true, 'm.youtube.com': true, 'youtube-nocookie.com': true, 'www.youtube-nocookie.com': true };
const YOUTUBE_SHORT_HOSTS: Record<string, true> = { 'youtu.be': true, 'www.youtu.be': true };
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_EMBED_PARAMS = 'rel=0&playsinline=1&modestbranding=1';

// 只放行 http/https：库里可能残留未改写的 asset:// 等内部协议。
function parseHttpUrl(value: string | null | undefined): URL | null {
  if (!value) return null;
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    return null;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : null;
}

// 取 pathname 的扩展名（小写、带点），query/hash 不参与判断。
function pathExtension(pathname: string): string {
  const match = /\.([A-Za-z0-9]+)$/.exec(pathname);
  return match ? `.${match[1].toLowerCase()}` : '';
}

// 各种 YouTube 链接形态统一提取视频 ID；提不出合法 ID 时返回 null，交给直链后缀判定。
function extractYouTubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);
  let candidate: string | null = null;
  if (YOUTUBE_SHORT_HOSTS[host]) {
    candidate = segments[0] ?? null;
  } else if (YOUTUBE_HOSTS[host]) {
    if (segments.length >= 2 && YOUTUBE_PATH_KINDS[segments[0]]) {
      candidate = segments[1];
    } else if (segments[0] === 'watch') {
      candidate = url.searchParams.get('v');
    }
  }
  const id = candidate?.trim() ?? '';
  return YOUTUBE_ID_PATTERN.test(id) ? id : null;
}

export function resolveHeroVideo(input: HeroVideoInput): HeroVideoView | null {
  const previewUrl = parseHttpUrl(input.video_preview);
  if (!previewUrl) return null;

  const imageUrl = parseHttpUrl(input.video_image);
  // 封面也常混入失效的 .bin，后缀对不上就当没有封面。
  const poster = imageUrl && IMAGE_EXTENSIONS[pathExtension(imageUrl.pathname)] ? String(input.video_image).trim() : '';

  const youtubeId = extractYouTubeId(previewUrl);
  if (youtubeId) {
    const view: HeroVideoView = {
      source: { kind: 'embed', provider: 'youtube', url: `https://www.youtube.com/embed/${youtubeId}?${YOUTUBE_EMBED_PARAMS}` },
    };
    if (poster) view.poster = poster;
    return view;
  }

  if (VIDEO_EXTENSIONS[pathExtension(previewUrl.pathname)]) {
    // 原样交付库里的地址：CDN 直链可能带签名/参数，重写会失效。
    const view: HeroVideoView = { source: { kind: 'file', url: String(input.video_preview).trim() } };
    if (poster) view.poster = poster;
    return view;
  }

  return null;
}
