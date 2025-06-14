
import React from 'react';
import { Control } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { InvoiceFormData } from './InvoiceFormSchema';

interface InvoiceNotesCardProps {
  control: Control<InvoiceFormData>;
}

export const InvoiceNotesCard: React.FC<InvoiceNotesCardProps> = ({ control }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Add any additional notes for this invoice..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
