
import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';

interface SidebarTriggerProps {
  className?: string;
}

export const SidebarTrigger: React.FC<SidebarTriggerProps> = ({ className }) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={toggleSidebar}
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
};
