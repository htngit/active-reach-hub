
import React from 'react';
import { ContactManager } from '@/components/ContactManager/ContactManager';

const ContactsPage: React.FC = () => {
  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="container mx-auto p-3 sm:p-6 max-w-full">
        <ContactManager />
      </div>
    </div>
  );
};

export default ContactsPage;
