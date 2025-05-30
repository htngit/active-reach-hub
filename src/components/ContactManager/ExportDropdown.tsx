
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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

export const ExportDropdown: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();

  const fetchContacts = async (): Promise<Contact[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  };

  const exportToCSV = (contacts: Contact[]) => {
    const headers = ['Name', 'Phone Number', 'Email', 'Company', 'Address', 'Notes', 'Labels', 'Status', 'Potential Products', 'Created At'];
    
    const csvContent = [
      headers.join(','),
      ...contacts.map(contact => [
        `"${contact.name}"`,
        `"${contact.phone_number}"`,
        `"${contact.email || ''}"`,
        `"${contact.company || ''}"`,
        `"${contact.address || ''}"`,
        `"${contact.notes || ''}"`,
        `"${contact.labels?.join('; ') || ''}"`,
        `"${contact.status}"`,
        `"${contact.potential_product?.join('; ') || ''}"`,
        `"${new Date(contact.created_at).toLocaleString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToXLS = (contacts: Contact[]) => {
    const headers = ['Name', 'Phone Number', 'Email', 'Company', 'Address', 'Notes', 'Labels', 'Status', 'Potential Products', 'Created At'];
    
    let xlsContent = '<table>';
    xlsContent += '<tr>' + headers.map(header => `<th>${header}</th>`).join('') + '</tr>';
    
    contacts.forEach(contact => {
      xlsContent += '<tr>';
      xlsContent += `<td>${contact.name}</td>`;
      xlsContent += `<td>${contact.phone_number}</td>`;
      xlsContent += `<td>${contact.email || ''}</td>`;
      xlsContent += `<td>${contact.company || ''}</td>`;
      xlsContent += `<td>${contact.address || ''}</td>`;
      xlsContent += `<td>${contact.notes || ''}</td>`;
      xlsContent += `<td>${contact.labels?.join('; ') || ''}</td>`;
      xlsContent += `<td>${contact.status}</td>`;
      xlsContent += `<td>${contact.potential_product?.join('; ') || ''}</td>`;
      xlsContent += `<td>${new Date(contact.created_at).toLocaleString()}</td>`;
      xlsContent += '</tr>';
    });
    
    xlsContent += '</table>';

    const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (format: 'csv' | 'xls') => {
    setIsExporting(true);
    try {
      const contacts = await fetchContacts();
      
      if (contacts.length === 0) {
        toast({
          title: "No Data",
          description: "No contacts available to export",
          variant: "destructive",
        });
        return;
      }

      if (format === 'csv') {
        exportToCSV(contacts);
      } else {
        exportToXLS(contacts);
      }

      toast({
        title: "Export Successful",
        description: `Contacts exported as ${format.toUpperCase()} file`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export contacts",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border shadow-md">
        <DropdownMenuItem 
          onClick={() => handleExport('csv')}
          className="cursor-pointer hover:bg-gray-100"
        >
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('xls')}
          className="cursor-pointer hover:bg-gray-100"
        >
          Export as XLS
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
