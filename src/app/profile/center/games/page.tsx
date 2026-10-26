import { Suspense } from 'react';

import CenterPageSkeleton from '../CenterPageSkeleton';
import GamesPageView from './GamesPageView';

/**
 * 服务端包装层：视图本身是客户端组件且读取 useSearchParams()，
 * 放在 Suspense 边界内既能通过预渲染的 CSR 回退检查，也让首屏加载有骨架。
 * 这里刻意不加 loading.tsx：段级 loading 会把 notFound() 退化成软 404。
 */
export default function ProfileCenterGamesPage() {
  return (
    <Suspense
      fallback={<CenterPageSkeleton variant="grid" maxWidthClassName="max-w-5xl" label="正在加载关注游戏" />}
    >
      <GamesPageView />
    </Suspense>
  );
}
