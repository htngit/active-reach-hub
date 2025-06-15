
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { BasicInformationSection } from './BasicInformationSection';
import { AddressSection } from './AddressSection';
import { ContactSection } from './ContactSection';
import { BankingSection } from './BankingSection';
import { LogoSection } from './LogoSection';

interface EditTeamDialogFormProps {
  form: UseFormReturn<any>;
  onSubmit: (values: any) => void;
  updating: boolean;
  onCancel: () => void;
  team: any;
  onLogoUpdated: () => void;
}

export const EditTeamDialogForm: React.FC<EditTeamDialogFormProps> = ({
  form,
  onSubmit,
  updating,
  onCancel,
  team,
  onLogoUpdated
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <BasicInformationSection form={form} updating={updating} />
        <LogoSection team={team} onLogoUpdated={onLogoUpdated} updating={updating} />
        <AddressSection form={form} updating={updating} />
        <ContactSection form={form} updating={updating} />
        <BankingSection form={form} updating={updating} />

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={updating}>
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={updating}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};
