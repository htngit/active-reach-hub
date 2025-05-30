import React, { useState } from 'react';
import { ContactList } from './ContactList';
import { ContactDetail } from './ContactDetail';
import { AddContactForm } from './AddContactForm';
import { MessageTemplates } from './MessageTemplates';
import { FollowUpTabs } from './FollowUpTabs';
import { PersonalSettings } from '../Settings/PersonalSettings';
import { EmailVerificationBanner } from '../Auth/EmailVerificationBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, MessageSquare, Settings } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  phone_number: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
  labels?: string[];
  status: string;
  potential_product?: string[];
  created_at: string;
}

export const ContactManager = () => {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState('contacts');
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };

  const handleBackToList = () => {
    setSelectedContact(null);
    setShowAddForm(false);
  };

  const handleContactAdded = () => {
    setShowAddForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleContactUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddContact = () => {
    setShowAddForm(true);
  };

  const handleLabelFilterChange = (labels: string[]) => {
    setSelectedLabels(labels);
  };

  if (selectedContact) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <EmailVerificationBanner />
        <ContactDetail
          contact={selectedContact}
          onBack={handleBackToList}
          onContactUpdated={handleContactUpdated}
        />
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <EmailVerificationBanner />
        <AddContactForm
          onBack={handleBackToList}
          onContactAdded={handleContactAdded}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <EmailVerificationBanner />
      
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Contact Manager</h1>
        <p className="text-gray-600">Manage your contacts and follow-ups</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-0">
          <TabsTrigger value="contacts" className="flex items-center gap-2 min-h-[44px]">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Contacts</span>
          </TabsTrigger>
          <TabsTrigger value="follow-up" className="flex items-center gap-2 min-h-[44px]">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Follow Up</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2 min-h-[44px]">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 min-h-[44px]">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-6">
          <ContactList
            onSelectContact={handleContactSelect}
            onAddContact={handleAddContact}
            selectedLabels={selectedLabels}
            onLabelFilterChange={handleLabelFilterChange}
          />
        </TabsContent>

        <TabsContent value="follow-up" className="mt-6">
          <FollowUpTabs onSelectContact={handleContactSelect} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <MessageTemplates />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <PersonalSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};