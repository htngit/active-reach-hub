
import React, { useState } from 'react';
import { ContactList } from './ContactList';
import { ContactDetail } from './ContactDetail';
import { AddContactForm } from './AddContactForm';
import { MessageTemplates } from './MessageTemplates';
import { FollowUpTabs } from './FollowUpTabs';
import { EmailVerificationBanner } from '../Auth/EmailVerificationBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Calendar, MessageSquare } from 'lucide-react';

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
      <div className="space-y-6">
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
      <div className="space-y-6">
        <EmailVerificationBanner />
        <AddContactForm
          onBack={handleBackToList}
          onContactAdded={handleContactAdded}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <EmailVerificationBanner />
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Contact Manager</h1>
        <p className="text-gray-600">Manage your contacts and follow-ups</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="follow-up" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Follow Up
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <ContactList
            onSelectContact={handleContactSelect}
            onAddContact={handleAddContact}
            selectedLabels={selectedLabels}
            onLabelFilterChange={handleLabelFilterChange}
            onContactsDeleted={handleContactUpdated}
          />
        </TabsContent>

        <TabsContent value="follow-up">
          <FollowUpTabs onSelectContact={handleContactSelect} />
        </TabsContent>

        <TabsContent value="templates">
          <MessageTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
};
