
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MOCK_FORUM_SECTIONS } from '@/lib/constants';
import type { ForumSection } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';


export default function CommunitySidebar() {
  const [activeSection, setActiveSection] = useState<string>('general'); // Default to general

  return (
    <Card className="sticky top-20 shadow-sm"> {/* top-20 to account for header height */}
      <CardContent className="p-3 space-y-1">
        {MOCK_FORUM_SECTIONS.map((section) => {
          const IconComponent = section.icon;
          const isActive = activeSection === section.id;

          if (section.type === 'action') {
            return (
              <Button
                key={section.id}
                variant="ghost"
                className="w-full justify-start text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 px-3 py-2.5"
                asChild
              >
                <Link href={section.href}>
                  {section.name}
                  {IconComponent && <IconComponent className="ml-auto h-4 w-4" />}
                </Link>
              </Button>
            );
          }

          return (
            <Button
              key={section.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-sm px-3 py-2.5 h-auto",
                isActive ? "bg-primary/10 text-primary font-semibold" : "text-foreground/80 hover:text-primary hover:bg-primary/5"
              )}
              onClick={() => setActiveSection(section.id)}
              asChild
            >
              <Link href={section.href}>
                {section.imageUrl ? (
                  <Image
                    src={section.imageUrl}
                    alt={section.name}
                    width={24}
                    height={24}
                    className="mr-2 rounded-sm object-cover"
                    data-ai-hint={section.dataAiHint}
                  />
                ) : IconComponent ? (
                  <IconComponent className="mr-2 h-5 w-5 flex-shrink-0" />
                ) : (
                  <span className="mr-2 h-5 w-5 flex-shrink-0" /> // Placeholder for alignment
                )}
                <span className="truncate">{section.name}</span>
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
