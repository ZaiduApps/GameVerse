'use client';

import { useState } from 'react';
import { Check, Copy, ShieldCheck } from 'lucide-react';

import type { ResourceChecksumItem } from '@/lib/game-resource-signature';

interface GameResourceChecksumsProps {
  items: ResourceChecksumItem[];
}

/**
 * 详情页的资源校验值区块。
 *
 * 只展示接口真实返回的 `signature`（SHA-256）：有值才给复制与比对说明，
 * 没有值就明确写「暂无校验值」，不生成占位哈希。
 * 服务端渲染时输出的是同样的静态结构，复制按钮只是渐进增强。
 */
export default function GameResourceChecksums({ items }: GameResourceChecksumsProps) {
  const [copiedId, setCopiedId] = useState('');
  const [failedId, setFailedId] = useState('');

  async function handleCopy(item: ResourceChecksumItem) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(item.signature);
      setFailedId('');
      setCopiedId(item.resourceId);
      window.setTimeout(() => {
        setCopiedId((current) => (current === item.resourceId ? '' : current));
      }, 2000);
    } catch {
      setCopiedId('');
      setFailedId(item.resourceId);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#abadae]/30 p-3 text-xs leading-6 text-muted-foreground lg:p-4 lg:text-sm dark:border-border/45">
        暂无校验值
        <span className="mt-1 block text-[11px] lg:text-xs">
          资源提供方尚未给出 SHA-256 校验值，下载完成后可在本地自行计算核对。
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <ul className="space-y-2">
        {items.map((item) => {
          const copied = copiedId === item.resourceId;
          return (
            <li
              key={item.resourceId || `${item.channelName}-${item.signature}`}
              className="flex flex-col gap-2 rounded-xl border border-[#abadae]/15 bg-[#eff1f2]/70 p-2.5 sm:flex-row sm:items-center sm:justify-between lg:p-3.5 dark:border-border/45 dark:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-[#2c2f30] lg:text-sm dark:text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-tone-green" aria-hidden="true" />
                  {item.channelName}
                  {item.version ? (
                    <span className="font-normal text-muted-foreground">v{item.version}</span>
                  ) : null}
                </p>
                <p
                  className="mt-1 break-all font-mono text-[11px] leading-5 text-[#595c5d] lg:text-xs dark:text-muted-foreground"
                  title={item.signature}
                >
                  SHA-256：{item.signatureShort}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleCopy(item)}
                aria-label={`复制 ${item.channelName} 的 SHA-256 校验值`}
                className="inline-flex shrink-0 items-center justify-center gap-1 rounded-lg border border-[#abadae]/25 bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#2c2f30] transition-colors [@media(hover:hover)]:hover:bg-[#e6e8ea] lg:text-xs dark:border-border/45 dark:bg-card dark:text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-tone-green" aria-hidden="true" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    复制完整校验值
                  </>
                )}
              </button>
              {failedId === item.resourceId ? (
                <span role="status" className="text-[11px] text-tone-red">
                  复制失败，请手动选择上面的校验值
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] leading-5 text-muted-foreground lg:text-xs">
        校验值来自资源提供方。下载完成后可在本地执行 sha256sum（Windows 用 certutil -hashfile）并与上方完整值比对。
      </p>
    </div>
  );
}
