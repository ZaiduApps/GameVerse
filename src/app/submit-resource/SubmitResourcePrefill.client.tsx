'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export interface SubmitResourcePrefillValues {
  resourceName: string;
  sourceUrl: string;
}

/**
 * 从查询串回填「求添加资源」表单（下载失败提示里的「反馈失效」会带上
 * resourceName / sourceUrl）。只回填一次，避免覆盖用户随后输入的内容；
 * 读取 useSearchParams 需要 Suspense 边界，由页面负责包裹。
 */
export default function SubmitResourcePrefill({
  onPrefill,
}: {
  onPrefill: (values: SubmitResourcePrefillValues) => void;
}) {
  const searchParams = useSearchParams();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (appliedRef.current) return;
    const resourceName = String(searchParams.get('resourceName') || '').trim();
    const sourceUrl = String(searchParams.get('sourceUrl') || '').trim();
    if (!resourceName && !sourceUrl) return;
    appliedRef.current = true;
    onPrefill({ resourceName, sourceUrl });
  }, [onPrefill, searchParams]);

  return null;
}
