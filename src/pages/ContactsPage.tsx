
import React from 'react';
import { ContactManager } from '@/components/ContactManager/ContactManager';

const ContactsPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <ContactManager />
    </div>
  );
};

export default ContactsPage;
