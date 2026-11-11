import Link from 'next/link';
import { Download, FileQuestion, Home, Search as SearchIcon } from 'lucide-react';

import NotFoundSimilarGames from '@/components/not-found-similar-games.client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { RecoveryGame } from '@/lib/not-found-recovery';

/**
 * 404 正文（待决策 #203）：在保留 HTTP 404 + noindex 的前提下，给三条可点入口
 * ——站内搜索、同类游戏（客户端按原始 URL 取推荐）、热门下载 Top 5（服务端取数）。
 *
 * 拆成纯展示组件是为了能在 node:test 里直接渲染断言：
 * 热门榜为空时整块不出现，搜索入口始终存在。
 */
export interface NotFoundViewProps {
  /** 服务端取到的下载榜；取数失败时为空数组，整块不渲染。 */
  hotGames: RecoveryGame[];
}

const HOT_GAMES_LIMIT = 5;

export default function NotFoundView({ hotGames }: NotFoundViewProps) {
  const hot = hotGames.slice(0, HOT_GAMES_LIMIT);

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-2 py-8 sm:px-4 sm:py-12">
      <Card className="w-full max-w-xl">
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
            该内容可能已下线、被移除，或链接地址有误。可以搜索目标游戏，或从下面的入口继续浏览。
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* 入口一：站内搜索，直接复用 `/search?q=` 路由（GET 表单，无需客户端状态）。 */}
          <form action="/search" method="get" role="search" className="flex gap-2">
            <label htmlFor="not-found-search" className="sr-only">
              搜索游戏或内容
            </label>
            <Input
              id="not-found-search"
              name="q"
              type="search"
              minLength={2}
              maxLength={60}
              placeholder="输入游戏名、包名或关键词"
              autoComplete="off"
            />
            <Button type="submit" className="shrink-0">
              <SearchIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              搜索
            </Button>
          </form>

          {/* 入口二：同类游戏。取不到（非 /app/<id>、接口空或失败）时整块不渲染。 */}
          <NotFoundSimilarGames />

          {/* 入口三：热门下载 Top 5。服务端取数失败时 hot 为空，整块不渲染。 */}
          {hot.length > 0 ? (
            <section aria-labelledby="not-found-hot-title">
              <h2
                id="not-found-hot-title"
                className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground"
              >
                <Download className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                热门下载 Top 5
              </h2>
              <ol className="flex flex-col gap-1.5">
                {hot.map((game, index) => (
                  <li key={game.pkg}>
                    <Link
                      href={`/app/${encodeURIComponent(game.pkg)}`}
                      className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:bg-muted/60"
                    >
                      <span className="w-4 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-foreground">{game.name}</span>
                      {game.downloads ? (
                        <span className="shrink-0 text-xs text-muted-foreground">{game.downloads} 下载</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                返回首页
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app">
                <SearchIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                逛游戏库
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
