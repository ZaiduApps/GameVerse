'use client';

import React from 'react';
import Link from 'next/link';

type CenterPageHeaderProps = {
  title: string;
  description: string;
};

export default function CenterPageHeader({ title, description }: CenterPageHeaderProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">
        <Link href="/profile" className="hover:text-primary hover:underline">个人中心</Link>
        <span className="mx-1">/</span>
        <span>{title}</span>
      </div>
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
