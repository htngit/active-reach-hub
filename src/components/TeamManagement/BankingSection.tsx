
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';

interface BankingSectionProps {
  form: UseFormReturn<any>;
  updating: boolean;
}

export const BankingSection: React.FC<BankingSectionProps> = ({
  form,
  updating
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Banking Information</h3>
      
      <FormField
        control={form.control}
        name="bank_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bank Name</FormLabel>
            <FormControl>
              <Input {...field} disabled={updating} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="bank_account"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bank Account Number</FormLabel>
            <FormControl>
              <Input {...field} disabled={updating} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="bank_account_holder"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Holder Name</FormLabel>
            <FormControl>
              <Input {...field} disabled={updating} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="swift_code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SWIFT Code</FormLabel>
            <FormControl>
              <Input {...field} disabled={updating} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
