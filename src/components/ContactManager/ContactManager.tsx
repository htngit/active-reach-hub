
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactList } from './ContactList';
import { ContactDetail } from './ContactDetail';
import { AddContactForm } from './AddContactForm';
import { FollowUpTabs } from './FollowUpTabs';
import { LogOut, Users, Clock } from 'lucide-react';

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

type View = 'list' | 'detail' | 'add' | 'followup';

export const ContactManager = () => {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { signOut, user } = useAuth();

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setCurrentView('detail');
  };

  const handleAddContact = () => {
    setCurrentView('add');
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedContact(null);
  };

  const handleContactUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Contact Manager</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'detail' && selectedContact ? (
          <ContactDetail
            contact={selectedContact}
            onBack={handleBack}
            onContactUpdated={handleContactUpdated}
          />
        ) : currentView === 'add' ? (
          <AddContactForm
            onBack={handleBack}
            onContactAdded={() => {
              handleBack();
              handleContactUpdated();
            }}
          />
        ) : (
          <Tabs defaultValue="contacts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                All Contacts
              </TabsTrigger>
              <TabsTrigger value="followups" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Follow-Ups
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contacts" className="space-y-4">
              <ContactList
                key={refreshKey}
                onSelectContact={handleSelectContact}
                onAddContact={handleAddContact}
                selectedLabels={selectedLabels}
                onLabelFilterChange={setSelectedLabels}
              />
            </TabsContent>

            <TabsContent value="followups" className="space-y-4">
              <FollowUpTabs onSelectContact={handleSelectContact} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};
