
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { ActionsDropdown } from './ActionsDropdown';

interface ContactSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddContact: () => void;
  onImportSuccess: () => void;
}

export const ContactSearchBar: React.FC<ContactSearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onAddContact,
  onImportSuccess,
}) => {
  return (
    <div className="flex flex-col space-y-3 max-w-full">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
        <div className="flex-1">
          <ActionsDropdown onImportSuccess={onImportSuccess} />
        </div>
        <Button onClick={onAddContact} className="w-full sm:w-auto text-xs sm:text-sm flex items-center justify-center gap-1 sm:gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Contact</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </div>
  );
};
