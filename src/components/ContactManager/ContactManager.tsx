
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

  return (
    <div className="flex flex-col space-y-6 max-w-full overflow-hidden">
      <EmailVerificationBanner />
      
      {selectedContact ? (
        <ContactDetail
          contact={selectedContact}
          onBack={handleBackToList}
          onContactUpdated={handleContactUpdated}
        />
      ) : showAddForm ? (
        <AddContactForm
          onBack={handleBackToList}
          onContactAdded={handleContactAdded}
        />
      ) : (
        <>
          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Contact Manager</h1>
            <p className="text-gray-600">Manage your contacts and follow-ups</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col space-y-6 max-w-full">
            <TabsList className="grid grid-cols-3 w-full h-12 sm:h-14">
              <TabsTrigger value="contacts" className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Contacts</span>
              </TabsTrigger>
              <TabsTrigger value="follow-up" className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Follow Up</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Templates</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="max-w-full">
              <ContactList
                onSelectContact={handleContactSelect}
                onAddContact={handleAddContact}
                selectedLabels={selectedLabels}
                onLabelFilterChange={handleLabelFilterChange}
                onContactsDeleted={handleContactUpdated}
              />
            </TabsContent>

            <TabsContent value="follow-up" className="max-w-full">
              <FollowUpTabs onSelectContact={handleContactSelect} />
            </TabsContent>

            <TabsContent value="templates" className="max-w-full">
              <MessageTemplates />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
