
import React from 'react';
import { PersonalSettings as PersonalSettingsComponent } from '@/components/Settings/PersonalSettings';

const PersonalSettings: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <PersonalSettingsComponent />
    </div>
  );
};

export default PersonalSettings;
