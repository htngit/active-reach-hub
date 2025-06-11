import React from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * MobileNav component that displays a burger menu button on mobile devices
 * to toggle the sidebar visibility
 */
export function MobileNav() {
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed top-4 left-4 z-40 md:hidden">
      <Button
        variant="outline"
        size="icon"
        className="h-10 w-10 rounded-full bg-background shadow-md"
        onClick={() => setOpenMobile(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
}