
import React from 'react';
import { ContactManager } from '@/components/ContactManager/ContactManager';

const ContactsPage: React.FC = () => {
  return (
    <div className="w-full">
      <div className="container mx-auto p-6 max-w-7xl">
        <ContactManager />
      </div>
    </div>
  );
};

export default ContactsPage;
