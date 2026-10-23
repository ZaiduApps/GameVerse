// Hero「实机 PV」的源解析：接口字段是 GP 抓取/运营上传的混合媒体地址，
// 只放行自家存储的 http(s) 视频直链（库里存 asset://，出口已改写成 CDN 地址）；
// 其余形态（YouTube 嵌入、GP 抓取残留的失效 .bin 等）解析不出可播放源就返回 null，
// 页面不渲染 PV 入口——不做占位视频，也不猜时长。
// 纯函数、无 import：服务端组件与 node 测试都可直接使用。

export interface HeroVideoView {
  source: { kind: 'file'; url: string };
  poster?: string;
}

interface HeroVideoInput {
  video_preview?: string | null;
  video_image?: string | null;
}

// 浏览器能直接播放的容器；未列出的后缀（例如失效的 .bin）无法判断，按无效处理。
const VIDEO_EXTENSIONS: Record<string, true> = { '.mp4': true, '.webm': true, '.mov': true, '.m4v': true, '.ogv': true };
const IMAGE_EXTENSIONS: Record<string, true> = { '.webp': true, '.jpg': true, '.jpeg': true, '.png': true, '.avif': true, '.gif': true };

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

export function resolveHeroVideo(input: HeroVideoInput): HeroVideoView | null {
  const previewUrl = parseHttpUrl(input.video_preview);
  if (!previewUrl) return null;

  // 只认自家视频直链；YouTube 等外链一律不播。
  if (!VIDEO_EXTENSIONS[pathExtension(previewUrl.pathname)]) return null;

  const imageUrl = parseHttpUrl(input.video_image);
  // 封面也常混入失效的 .bin，后缀对不上就当没有封面。
  const poster = imageUrl && IMAGE_EXTENSIONS[pathExtension(imageUrl.pathname)] ? String(input.video_image).trim() : '';

  // 原样交付库里的地址：CDN 直链可能带签名/参数，重写会失效。
  const view: HeroVideoView = { source: { kind: 'file', url: String(input.video_preview).trim() } };
  if (poster) view.poster = poster;
  return view;
}
