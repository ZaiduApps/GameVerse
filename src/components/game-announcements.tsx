
'use client';

import type { Announcement } from '@/types';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Megaphone, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { renderMarkdown } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface GameAnnouncementsProps {
  announcements?: {
    popup?: Announcement[];
    normal?: Announcement[];
    marquee?: Announcement[];
  };
}

const THEME_ICONS = {
  info: <Info className="w-5 h-5 text-primary mr-3 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />,
  success: <Info className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />,
  error: <AlertTriangle className="w-5 h-5 text-destructive mr-3 flex-shrink-0" />,
}

const THEME_COLORS = {
    info: 'border-primary/20 bg-primary/5',
    warning: 'border-yellow-500/20 bg-yellow-500/5',
    success: 'border-green-500/20 bg-green-500/5',
    error: 'border-destructive/20 bg-destructive/5',
}


export default function GameAnnouncements({ announcements }: GameAnnouncementsProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const popupAnnouncement = announcements?.popup?.[0];

  useEffect(() => {
    if (popupAnnouncement) {
      const hasBeenShown = localStorage.getItem(`popup_${popupAnnouncement._id}`);
      if (popupAnnouncement.once_per_user && hasBeenShown) {
        return;
      }
      // Set a timeout to ensure the UI is ready before showing the popup
      const timer = setTimeout(() => setIsPopupOpen(true), 100);
      return () => clearTimeout(timer);
    }
  }, [popupAnnouncement]);

  const handlePopupClose = () => {
    setIsPopupOpen(false);
    if (popupAnnouncement?.once_per_user) {
      localStorage.setItem(`popup_${popupAnnouncement._id}`, 'true');
    }
  };

  const handleOpenChange = (open: boolean) => {
    // Only allow closing if it's closeable or if the component is unmounting.
    if (!open && !popupAnnouncement?.closeable) {
      return; // Prevent closing
    }
    setIsPopupOpen(open);
    if (!open && popupAnnouncement?.once_per_user) {
        localStorage.setItem(`popup_${popupAnnouncement._id}`, 'true');
    }
  };


  return (
    <>
      {/* Marquee Announcements */}
      {announcements?.marquee && announcements.marquee.length > 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center">
              <Megaphone className="w-5 h-5 text-accent mr-3 flex-shrink-0" />
              <p className="text-xs md:text-sm text-foreground/80 overflow-hidden whitespace-nowrap">
                <span className="font-semibold text-accent mr-2">公告:</span>
                <span className="inline-block animate-marquee">
                  {announcements.marquee.map(a => a.title).join(' | ')}
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
        </Card>
      )}

      {/* Normal Announcements */}
      {announcements?.normal && announcements.normal.length > 0 && (
        <div className="space-y-4">
            {announcements.normal.map(announcement => (
                <Card key={announcement._id} className={cn("shadow-sm", THEME_COLORS[announcement.style?.theme || 'info'])}>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            {THEME_ICONS[announcement.style?.theme || 'info']}
                            <div>
                                <h3 className="font-semibold text-primary text-sm md:text-base">{announcement.title}</h3>
                                {announcement.summary && <p className="text-xs md:text-sm text-primary/80">{announcement.summary}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}


      {/* Popup Announcement Dialog */}
      {popupAnnouncement && (
        <Dialog open={isPopupOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center pr-8">
                {THEME_ICONS[popupAnnouncement.style?.theme || 'warning']}
                {popupAnnouncement.title}
              </DialogTitle>
              {popupAnnouncement.summary && <DialogDescription>{popupAnnouncement.summary}</DialogDescription>}
            </DialogHeader>
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed max-h-[60vh] overflow-y-auto"
              dangerouslySetInnerHTML={renderMarkdown(popupAnnouncement.content)}
            />
            <DialogFooter>
              <Button onClick={handlePopupClose}>
                我已知晓
              </Button>
            </DialogFooter>
             {popupAnnouncement.closeable && (
                <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={handlePopupClose} aria-label="关闭">
                    <X className="h-4 w-4" />
                </Button>
             )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

