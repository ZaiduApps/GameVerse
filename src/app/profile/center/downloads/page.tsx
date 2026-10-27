import { Suspense } from 'react';

import CenterPageSkeleton from '../CenterPageSkeleton';
import DownloadsPageView from './DownloadsPageView';

/**
 * 服务端包装层，与 center 下其它页面保持一致：
 * 客户端视图读取登录态与接口数据，Suspense 兜住首屏与 CSR 回退。
 * 不加 loading.tsx：段级 loading 会把 notFound() 退化成软 404。
 */
export default function ProfileCenterDownloadsPage() {
  return (
    <Suspense fallback={<CenterPageSkeleton maxWidthClassName="max-w-4xl" label="正在加载下载记录" />}>
      <DownloadsPageView />
    </Suspense>
  );
}
