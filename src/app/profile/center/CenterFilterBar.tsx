'use client';

import React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type FilterOption = {
  label: string;
  value: string;
};

type CenterFilterBarProps = {
  keyword: string;
  onKeywordChange: (value: string) => void;
  pageSize: number;
  onPageSizeChange: (value: number) => void;
  onClear: () => void;
  sort?: string;
  sortOptions?: FilterOption[];
  onSortChange?: (value: string) => void;
  status?: string;
  statusOptions?: FilterOption[];
  onStatusChange?: (value: string) => void;
  placeholder?: string;
};

export default function CenterFilterBar({
  keyword,
  onKeywordChange,
  pageSize,
  onPageSizeChange,
  onClear,
  sort,
  sortOptions,
  onSortChange,
  status,
  statusOptions,
  onStatusChange,
  placeholder = '搜索关键词',
}: CenterFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href="/profile" className="text-xs text-primary hover:underline">返回个人中心</Link>
      <Input
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        placeholder={placeholder}
        className="w-full max-w-xs"
      />
      {statusOptions && onStatusChange ? (
        <Select value={status || 'all'} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {sortOptions && onSortChange ? (
        <Select value={sort || 'latest'} onValueChange={onSortChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="排序" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <Select value={String(pageSize)} onValueChange={(val) => onPageSizeChange(Number(val))}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="每页" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="12">12 / 页</SelectItem>
          <SelectItem value="24">24 / 页</SelectItem>
          <SelectItem value="48">48 / 页</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="ghost" size="sm" onClick={onClear}>清空筛选</Button>
    </div>
  );
}
