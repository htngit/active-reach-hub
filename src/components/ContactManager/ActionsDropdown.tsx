import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Settings, Download, Upload } from 'lucide-react';
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

interface ActionsDropdownProps {
  onImportSuccess: () => void;
}

export const ActionsDropdown: React.FC<ActionsDropdownProps> = ({ onImportSuccess }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const downloadTemplate = () => {
    const headers = ['Name', 'Phone Number', 'Email', 'Company', 'Address', 'Notes', 'Labels', 'Status', 'Potential Product'];
    const sampleData = ['John Doe', '+1234567890', 'john@example.com', 'ABC Corp', '123 Main St', 'Sample notes', 'Client; VIP', 'New', 'Product A; Product B'];
    
    const csvContent = [
      headers.join(','),
      sampleData.map(field => `"${field}"`).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'contacts_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded successfully",
    });
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header.toLowerCase().replace(/\s+/g, '_')] = values[index];
        });
        data.push(row);
      }
    }

    return data;
  };

  const processImportData = async (data: any[]) => {
    if (!user) return;

    const allLabels = new Set<string>();
    data.forEach(row => {
      if (row.labels) {
        const labels = row.labels.split(';').map((label: string) => label.trim()).filter(Boolean);
        labels.forEach((label: string) => allLabels.add(label));
      }
    });

    const { data: existingLabelsData } = await supabase
      .from('labels')
      .select('name')
      .eq('user_id', user.id);
    
    const existingLabels = new Set(existingLabelsData?.map(l => l.name) || []);
    const newLabels = Array.from(allLabels).filter(label => !existingLabels.has(label));
    
    if (newLabels.length > 0) {
      const labelsToInsert = newLabels.map(name => ({
        user_id: user.id,
        name,
        color: null
      }));
      
      await supabase.from('labels').insert(labelsToInsert);
    }

    const contacts = data.map(row => ({
      user_id: user.id,
      owner_id: user.id,
      name: row.name || '',
      phone_number: row.phone_number || '',
      email: row.email || null,
      company: row.company || null,
      address: row.address || null,
      notes: row.notes || null,
      labels: row.labels ? row.labels.split(';').map((label: string) => label.trim()).filter(Boolean) : null,
      status: row.status || 'New',
      potential_product: row.potential_product ? row.potential_product.split(';').map((product: string) => product.trim()).filter(Boolean) : null,
      team_id: null
    })).filter(contact => contact.name && contact.phone_number);

    if (contacts.length === 0) {
      throw new Error('No valid contacts found in the file');
    }

    const { data: insertedData, error } = await supabase
      .from('contacts')
      .insert(contacts)
      .select();

    if (error) throw error;
    return insertedData?.length || 0;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const text = await file.text();
      const data = parseCSV(text);
      
      if (data.length === 0) {
        throw new Error('No valid data found in the CSV file');
      }

      const importedCount = await processImportData(data);
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${importedCount} contacts`,
      });

      onImportSuccess();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import contacts",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        style={{ display: 'none' }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isExporting || isImporting}>
            <Settings className="h-4 w-4 mr-2" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
          <DropdownMenuItem 
            onClick={() => handleExport('csv')}
            className="cursor-pointer hover:bg-muted"
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleExport('xls')}
            className="cursor-pointer hover:bg-muted"
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export as XLS
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={downloadTemplate}
            className="cursor-pointer hover:bg-muted"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template CSV
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={triggerFileUpload}
            className="cursor-pointer hover:bg-muted"
            disabled={isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};