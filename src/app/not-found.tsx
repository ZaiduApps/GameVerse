import type { Metadata } from 'next';

import Link from 'next/link';
import { FileQuestion, Home, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';

/**
 * 404 页面元数据。
 *
 * 动态路由对不存在的 ID 会调用 notFound()，此前根布局的 title.default
 * （站点 slogan）被继承下来，软 404 页因此带着首页标题。这里显式声明
 * 404 语义：标题自指「页面不存在」并强制 noindex，避免与首页争夺同一 query。
 */
export const metadata: Metadata = {
  title: '页面不存在 | APKScc',
  description: '该页面已下线或地址有误，请返回首页或重新搜索。',
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-2 py-8 sm:px-4 sm:py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <FileQuestion className="mb-2 h-10 w-10 text-muted-foreground" aria-hidden="true" />
          {/*
            这里不用 CardTitle：它渲染 h3，而本仓库根布局已经输出了站点级 h1，
            404 页再挂 h3 会让标题层级从 h1 直接跳到 h3。Tailwind preflight 会把
            标题标签的字号字重重置为继承，因此下面这组类名与 CardTitle 完全一致，
            换标签不产生任何视觉差异。
          */}
          <h1 className="text-lg font-semibold leading-none tracking-tight sm:text-xl">
            页面不存在
          </h1>
          <CardDescription>
            该内容可能已下线、被移除，或链接地址有误。可以返回首页继续浏览，或直接搜索目标游戏。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              返回首页
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app">
              <Search className="mr-2 h-4 w-4" aria-hidden="true" />
              逛游戏库
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
