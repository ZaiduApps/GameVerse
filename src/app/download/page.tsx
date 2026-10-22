import { permanentRedirect } from 'next/navigation';

// 详情页的「立即下载 AC 盒子」CTA 曾指向 /download，但下载落地页一直是 /download/app。
// 这里保留一个永久重定向：外链、历史页面和漏改的内链不会再拿到 404，也不会产生重复内容。
// 站内链接仍应直接指向 /download/app，避免多一跳。
export default function LegacyDownloadRedirectPage() {
  permanentRedirect('/download/app');
}
