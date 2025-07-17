
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
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        <ActionsDropdown onImportSuccess={onImportSuccess} />
        <Button onClick={onAddContact} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>
    </div>
  );
};
