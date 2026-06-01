'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LockKeyhole, LogIn, MoveLeft } from 'lucide-react';

import AuthModal from '@/components/auth/auth-modal';
import CenterPageHeader from './CenterPageHeader';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type CenterAuthRequiredProps = {
  title: string;
  description: string;
  containerClassName?: string;
};

export default function CenterAuthRequired({
  title,
  description,
  containerClassName,
}: CenterAuthRequiredProps) {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
      <div className={cn('mx-auto w-full space-y-4 py-4 md:py-8', containerClassName)}>
        <CenterPageHeader title={title} description={description} />
        <Card>
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">登录后查看个人中心内容</h2>
              <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
                当前页面会展示与你账号绑定的内容。登录成功后会继续留在这里，当前浏览位置也能保持得更稳定。
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="min-w-32" onClick={() => setAuthModalOpen(true)}>
                <LogIn className="mr-2 h-4 w-4" />
                登录 / 注册
              </Button>
              <Button asChild variant="outline" className="min-w-32">
                <Link href="/">
                  <MoveLeft className="mr-2 h-4 w-4" />
                  返回首页
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
}
