
import React, { useState } from 'react';
import { ContactList } from './ContactList';
import { ContactDetail } from './ContactDetail';
import { AddContactForm } from './AddContactForm';
import { MessageTemplates } from './MessageTemplates';
import { PersonalSettings } from '../Settings/PersonalSettings';
import { EmailVerificationBanner } from '../Auth/EmailVerificationBanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, MessageSquare, Settings } from 'lucide-react';

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

  if (selectedContact) {
    return (
      <div className="container mx-auto p-6">
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
      <div className="container mx-auto p-6">
        <EmailVerificationBanner />
        <AddContactForm
          onBack={handleBackToList}
          onContactAdded={handleContactAdded}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <EmailVerificationBanner />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Contact Manager</h1>
        <p className="text-gray-600">Manage your contacts and follow-ups</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="add-contact" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Contact
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Message Templates
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <ContactList
            onContactSelect={handleContactSelect}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="add-contact">
          <AddContactForm
            onBack={() => setActiveTab('contacts')}
            onContactAdded={() => {
              setActiveTab('contacts');
              handleContactAdded();
            }}
          />
        </TabsContent>

        <TabsContent value="templates">
          <MessageTemplates />
        </TabsContent>

        <TabsContent value="settings">
          <PersonalSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
