
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <Dialog open>
      <DialogContent className="bg-transparent border-none shadow-none flex items-center justify-center">
        <DialogHeader>
          <DialogTitle className="sr-only">Loading...</DialogTitle>
        </DialogHeader>
        <Loader2 className="h-16 w-16 text-primary animate-spin" />
      </DialogContent>
    </Dialog>
  );
}
