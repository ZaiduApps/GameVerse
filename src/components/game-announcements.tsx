'use client';

import type { Announcement } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Megaphone, Info, ShieldAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { renderMarkdown } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

interface GameAnnouncementsProps {
  announcements?: {
    popup?: Announcement[];
    normal?: Announcement[];
    marquee?: Announcement[];
    system?: Announcement[];
    [key: string]: Announcement[] | undefined;
  } | Announcement[];
  position?: 'home' | 'game_detail';
}

type AnnouncementType = 'popup' | 'marquee' | 'normal' | 'system';
type AnnouncementTheme = 'info' | 'warning' | 'success' | 'error';
type AnnouncementPosition = 'home' | 'game_detail';

const VALID_TYPES: AnnouncementType[] = ['popup', 'marquee', 'normal', 'system'];
const VALID_THEMES: AnnouncementTheme[] = ['info', 'warning', 'success', 'error'];

const THEME_ICONS = {
  info: <Info className="w-5 h-5 text-primary mr-3 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />,
  success: <Info className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />,
  error: <AlertTriangle className="w-5 h-5 text-destructive mr-3 flex-shrink-0" />,
};

const THEME_COLORS = {
  info: 'border-primary/20 bg-primary/5',
  warning: 'border-yellow-500/20 bg-yellow-500/5',
  success: 'border-green-500/20 bg-green-500/5',
  error: 'border-destructive/20 bg-destructive/5',
};

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeKey(value: unknown): string {
  return normalizeString(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function normalizeType(value: unknown, fallbackType: AnnouncementType = 'normal'): AnnouncementType {
  const key = normalizeKey(value);
  const typeAliasMap: Record<string, AnnouncementType> = {
    popup: 'popup',
    popups: 'popup',
    modal: 'popup',
    dialog: 'popup',
    marquee: 'marquee',
    marquees: 'marquee',
    ticker: 'marquee',
    scroll: 'marquee',
    scrolling: 'marquee',
    system: 'system',
    systems: 'system',
    system_notice: 'system',
    sys: 'system',
    normal: 'normal',
    notice: 'normal',
    notices: 'normal',
    list: 'normal',
  };
  const t = (typeAliasMap[key] || key) as AnnouncementType;
  return VALID_TYPES.includes(t) ? t : fallbackType;
}

function normalizeTheme(value: unknown): AnnouncementTheme {
  const t = normalizeString(value) as AnnouncementTheme;
  return VALID_THEMES.includes(t) ? t : 'info';
}

function normalizePosition(value: string): AnnouncementPosition | 'global' | '' {
  const key = normalizeKey(value);
  if (!key) return '';
  if (key === 'global' || key === 'all') return 'global';
  if (key === 'home' || key === 'home_page' || key === 'homepage' || key === 'index') return 'home';
  if (
    key === 'game_detail' ||
    key === 'detail' ||
    key === 'app_detail' ||
    key === 'game_page' ||
    key === 'detail_page'
  ) {
    return 'game_detail';
  }
  return '';
}

function isAllowedByPosition(item: Announcement, currentPosition: AnnouncementPosition): boolean {
  const positions = Array.isArray(item.position)
    ? item.position
        .map((p) => normalizePosition(String(p)))
        .filter((p): p is 'global' | AnnouncementPosition => !!p)
    : [];
  if (positions.length === 0) return true;
  if (positions.includes('global')) return true;
  return positions.includes(currentPosition);
}

function normalizeAnnouncements(
  input: GameAnnouncementsProps['announcements'],
  currentPosition: AnnouncementPosition,
): { popup: Announcement[]; marquee: Announcement[]; system: Announcement[]; normal: Announcement[] } {
  const list: Announcement[] = [];

  const pushItem = (item: unknown, fallbackType: AnnouncementType) => {
    if (!item || typeof item !== 'object') return;
    const raw = item as Record<string, unknown>;

    const linkTypeRaw = normalizeString((raw.link as Record<string, unknown> | undefined)?.type);
    const linkUrlRaw = normalizeString((raw.link as Record<string, unknown> | undefined)?.url).trim();
    const link =
      (linkTypeRaw === 'inner' || linkTypeRaw === 'outer') && linkUrlRaw
        ? { type: linkTypeRaw as 'inner' | 'outer', url: linkUrlRaw }
        : undefined;

    const normalized: Announcement = {
      _id: normalizeString(raw._id || raw.id),
      title: normalizeString(raw.title),
      summary: normalizeString(raw.summary),
      content: normalizeString(raw.content),
      type: normalizeType(raw.type, fallbackType),
      position: Array.isArray(raw.position)
        ? (raw.position.filter((p) => typeof p === 'string') as string[])
        : [],
      style: {
        ...(typeof raw.style === 'object' && raw.style ? (raw.style as Record<string, unknown>) : {}),
        theme: normalizeTheme((raw.style as Record<string, unknown> | undefined)?.theme),
      },
      link,
      closeable: raw.closeable === false ? false : true,
      once_per_user: Boolean(raw.once_per_user),
    };

    if (!normalized._id) {
      normalized._id = `${normalized.type}-${normalized.title || normalized.summary || 'announcement'}`;
    }

    list.push(normalized);
  };

  if (Array.isArray(input)) {
    input.forEach((item) => pushItem(item, 'normal'));
  } else if (input && typeof input === 'object') {
    (Object.entries(input) as Array<[string, unknown]>).forEach(([groupKey, rawValue]) => {
      const fallbackType = normalizeType(groupKey, 'normal');

      if (Array.isArray(rawValue)) {
        rawValue.forEach((item) => pushItem(item, fallbackType));
        return;
      }

      if (rawValue && typeof rawValue === 'object') {
        const wrapped = rawValue as Record<string, unknown>;
        const nested =
          (Array.isArray(wrapped.list) && wrapped.list) ||
          (Array.isArray(wrapped.items) && wrapped.items) ||
          (Array.isArray(wrapped.data) && wrapped.data);

        if (Array.isArray(nested)) {
          nested.forEach((item) => pushItem(item, fallbackType));
          return;
        }

        if ('_id' in wrapped || 'title' in wrapped || 'content' in wrapped) {
          pushItem(wrapped, fallbackType);
        }
      }
    });
  }

  const dedup = new Map<string, Announcement>();
  list.forEach((item) => {
    if (!isAllowedByPosition(item, currentPosition)) return;
    if (!dedup.has(item._id)) dedup.set(item._id, item);
  });

  const grouped = {
    popup: [] as Announcement[],
    marquee: [] as Announcement[],
    system: [] as Announcement[],
    normal: [] as Announcement[],
  };

  Array.from(dedup.values()).forEach((item) => {
    if (item.type === 'popup') grouped.popup.push(item);
    else if (item.type === 'marquee') grouped.marquee.push(item);
    else if (item.type === 'system') grouped.system.push(item);
    else grouped.normal.push(item);
  });

  return grouped;
}

const AnnouncementWrapper = ({ announcement, children }: { announcement: Announcement; children: React.ReactNode }) => {
  const href = announcement.link?.url?.trim();
  if (!announcement.link || !href) return <>{children}</>;
  if (announcement.link.type === 'outer') {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className="block">
      {children}
    </Link>
  );
};

export default function GameAnnouncements({ announcements, position = 'home' }: GameAnnouncementsProps) {
  const { user } = useAuth();
  const groupedAnnouncements = useMemo(
    () => normalizeAnnouncements(announcements, position),
    [announcements, position],
  );

  const popupAnnouncement = groupedAnnouncements.popup[0];
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    if (!popupAnnouncement) {
      setIsPopupOpen(false);
      return;
    }

    const userKey = user?._id || 'guest';
    const seenKey = `popup_seen_${position}_${userKey}_${popupAnnouncement._id}`;
    const hasBeenShown = localStorage.getItem(seenKey);
    if (popupAnnouncement.once_per_user && hasBeenShown) {
      setIsPopupOpen(false);
      return;
    }

    const timer = setTimeout(() => setIsPopupOpen(true), 80);
    return () => clearTimeout(timer);
  }, [popupAnnouncement, user?._id]);

  const handlePopupClose = () => {
    if (!popupAnnouncement) return;
    if (popupAnnouncement.closeable === false) return;

    setIsPopupOpen(false);
    if (popupAnnouncement.once_per_user) {
      const userKey = user?._id || 'guest';
      const seenKey = `popup_seen_${position}_${userKey}_${popupAnnouncement._id}`;
      localStorage.setItem(seenKey, '1');
    }
  };

  return (
    <>
      {groupedAnnouncements.marquee.length > 0 && (
        <Card className="border-transparent bg-card/90 shadow-sm">
          <AnnouncementWrapper announcement={groupedAnnouncements.marquee[0]}>
            <CardContent className="p-3">
              <div className="flex items-center">
                <Megaphone className="w-5 h-5 text-accent mr-3 flex-shrink-0" />
                <p className="text-xs md:text-sm text-foreground/80 overflow-hidden whitespace-nowrap">
                  <span className="font-semibold text-accent mr-2">公告:</span>
                  <span className="inline-block animate-marquee">
                    {groupedAnnouncements.marquee.map((a) => a.summary || a.title || a.content).filter(Boolean).join(' | ')}
                  </span>
                </p>
              </div>
              <style jsx>{`
                @keyframes marquee {
                  from { transform: translateX(100%); }
                  to { transform: translateX(-100%); }
                }
                .animate-marquee {
                  animation: marquee 15s linear infinite;
                }
              `}</style>
            </CardContent>
          </AnnouncementWrapper>
        </Card>
      )}

      {groupedAnnouncements.system.length > 0 && (
        <div className="space-y-3 mt-3">
          {groupedAnnouncements.system.slice(0, 2).map((announcement) => (
            <AnnouncementWrapper key={announcement._id} announcement={announcement}>
              <Card className="border-transparent bg-sky-500/5 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <ShieldAlert className="w-5 h-5 text-sky-600 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-sky-700 text-sm md:text-base">{announcement.title || announcement.summary}</h3>
                      {(announcement.summary || announcement.content) && (
                        <p className="text-xs md:text-sm text-sky-700/80 mt-1 line-clamp-3">
                          {announcement.summary || announcement.content}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnnouncementWrapper>
          ))}
        </div>
      )}

      {groupedAnnouncements.normal.length > 0 && (
        <div className="space-y-4 mt-3">
          {groupedAnnouncements.normal.slice(0, 2).map((announcement) => (
            <AnnouncementWrapper key={announcement._id} announcement={announcement}>
              <Card className={cn('border-transparent shadow-sm transition-all hover:shadow-md', THEME_COLORS[announcement.style?.theme || 'info'])}>
                <CardContent className="p-4">
                  <div className="flex items-start">
                    {THEME_ICONS[announcement.style?.theme || 'info']}
                    <div>
                      <h3 className="font-semibold text-primary text-sm md:text-base">{announcement.title || announcement.summary}</h3>
                      {(announcement.summary || announcement.content) && (
                        <p className="text-xs md:text-sm text-primary/80 mt-1 line-clamp-3">
                          {announcement.summary || announcement.content}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnnouncementWrapper>
          ))}
        </div>
      )}

      {popupAnnouncement && (
        <Dialog
          open={isPopupOpen}
          onOpenChange={(open) => {
            if (!open) handlePopupClose();
          }}
        >
          <DialogContent
            className="max-w-md"
            onEscapeKeyDown={(e) => {
              if (popupAnnouncement.closeable === false) e.preventDefault();
            }}
            onInteractOutside={(e) => {
              if (popupAnnouncement.closeable === false) e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center pr-8">
                {THEME_ICONS[popupAnnouncement.style?.theme || 'warning']}
                {popupAnnouncement.title || popupAnnouncement.summary || '公告'}
              </DialogTitle>
              {popupAnnouncement.summary && <DialogDescription>{popupAnnouncement.summary}</DialogDescription>}
            </DialogHeader>
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed max-h-[60vh] overflow-y-auto">
              <div
                dangerouslySetInnerHTML={renderMarkdown(
                  popupAnnouncement.content || popupAnnouncement.summary || popupAnnouncement.title,
                )}
              />
            </div>
            {popupAnnouncement.closeable !== false && (
              <DialogFooter>
                <Button onClick={handlePopupClose}>我知道了</Button>
              </DialogFooter>
            )}
            {popupAnnouncement.closeable !== false && (
              <button
                onClick={handlePopupClose}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">关闭</span>
              </button>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
