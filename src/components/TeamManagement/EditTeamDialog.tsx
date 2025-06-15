
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Team } from '@/types/team';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { EditTeamDialogForm } from './EditTeamDialogForm';

interface EditTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  onTeamUpdated: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  company_legal_name: z.string().optional(),
  tax_id: z.string().optional(),
  company_address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  company_phone: z.string().optional(),
  company_email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  website: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  bank_account_holder: z.string().optional(),
  swift_code: z.string().optional(),
});

export const EditTeamDialog: React.FC<EditTeamDialogProps> = ({
  open,
  onOpenChange,
  team,
  onTeamUpdated
}) => {
  const [updating, setUpdating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: team.name,
      description: team.description || '',
      company_legal_name: team.company_legal_name || '',
      tax_id: team.tax_id || '',
      company_address: team.company_address || '',
      city: team.city || '',
      state: team.state || '',
      postal_code: team.postal_code || '',
      country: team.country || 'Indonesia',
      company_phone: team.company_phone || '',
      company_email: team.company_email || '',
      website: team.website || '',
      bank_name: team.bank_name || '',
      bank_account: team.bank_account || '',
      bank_account_holder: team.bank_account_holder || '',
      swift_code: team.swift_code || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          ...values,
          updated_at: new Date().toISOString(),
        })
        .eq('id', team.id);

      if (error) throw error;
      
      onTeamUpdated();
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Company details updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update company details",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleLogoUpdated = () => {
    onTeamUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company Details</DialogTitle>
        </DialogHeader>

        <EditTeamDialogForm
          form={form}
          onSubmit={onSubmit}
          updating={updating}
          onCancel={handleCancel}
          team={team}
          onLogoUpdated={handleLogoUpdated}
        />
      </DialogContent>
    </Dialog>
  );
};
