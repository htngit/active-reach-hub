import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Settings, Download, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { normalizePhoneNumber, isValidPhoneNumber } from '@/utils/phoneUtils';

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

  const validateCSVFormat = (text: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    // Check if file has content
    if (lines.length === 0) {
      errors.push("File is empty");
      return { isValid: false, errors };
    }
    
    // Check minimum lines (header + at least 1 data row)
    if (lines.length < 2) {
      errors.push("File must contain at least a header row and one data row");
      return { isValid: false, errors };
    }

    // Validate headers
    const expectedHeaders = ['Name', 'Phone Number', 'Email', 'Company', 'Address', 'Notes', 'Labels', 'Status', 'Potential Product'];
    const actualHeaders = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
    
    // Check if all required headers are present
    const requiredHeaders = ['Name', 'Phone Number'];
    const missingRequired = requiredHeaders.filter(header => !actualHeaders.includes(header));
    if (missingRequired.length > 0) {
      errors.push(`Missing required headers: ${missingRequired.join(', ')}`);
    }

    // Check for unexpected headers
    const unexpectedHeaders = actualHeaders.filter(header => 
      header !== '' && !expectedHeaders.includes(header)
    );
    if (unexpectedHeaders.length > 0) {
      errors.push(`Unexpected headers found: ${unexpectedHeaders.join(', ')}`);
    }

    // Check header count
    if (actualHeaders.length !== expectedHeaders.length) {
      errors.push(`Expected ${expectedHeaders.length} columns, but found ${actualHeaders.length}`);
    }

    return { isValid: errors.length === 0, errors };
  };

  const validateCSVData = (data: any[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (data.length === 0) {
      errors.push("No valid data rows found");
      return { isValid: false, errors };
    }

    // Validate each row
    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index starts at 0 and we skip header
      
      // Check required fields
      if (!row.name || row.name.trim() === '') {
        errors.push(`Row ${rowNumber}: Name is required`);
      }
      
      if (!row.phone_number || row.phone_number.trim() === '') {
        errors.push(`Row ${rowNumber}: Phone Number is required`);
      }
      
      // Validate phone number format (basic validation)
      if (row.phone_number && !/^[\+]?[0-9\-\(\)\s]+$/.test(row.phone_number.trim())) {
        errors.push(`Row ${rowNumber}: Invalid phone number format`);
      }
      
      // Validate email format if provided
      if (row.email && row.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email.trim())) {
          errors.push(`Row ${rowNumber}: Invalid email format`);
        }
      }
      
      // Validate status if provided
      const validStatuses = ['New', 'Qualified', 'Contacted', 'Lost', 'Won'];
      if (row.status && row.status.trim() !== '' && !validStatuses.includes(row.status.trim())) {
        errors.push(`Row ${rowNumber}: Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  const parseCSV = (text: string): { data: any[]; errors: string[] } => {
    const lines = text.split('\n').filter(line => line.trim());
    const errors: string[] = [];
    
    if (lines.length < 2) {
      return { data: [], errors: ["Invalid CSV format"] };
    }

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
          const cleanValue = values[index].replace(/^"|"$/g, '').trim();
          row[header.toLowerCase().replace(/\s+/g, '_')] = cleanValue;
        });
        data.push(row);
      } else {
        errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
      }
    }

    return { data, errors };
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

    const contacts = data.map(row => {
      const rawPhone = row.phone_number || '';
      const normalizedPhone = normalizePhoneNumber(rawPhone);
      
      return {
        user_id: user.id,
        owner_id: user.id,
        name: row.name || '',
        phone_number: normalizedPhone,
        email: row.email || null,
        company: row.company || null,
        address: row.address || null,
        notes: row.notes || null,
        labels: row.labels ? row.labels.split(';').map((label: string) => label.trim()).filter(Boolean) : null,
        status: row.status || 'New',
        potential_product: row.potential_product ? row.potential_product.split(';').map((product: string) => product.trim()).filter(Boolean) : null,
        team_id: null
      };
    }).filter(contact => contact.name && contact.phone_number && isValidPhoneNumber(contact.phone_number));

    if (contacts.length === 0) {
      throw new Error('No valid contacts found in the file');
    }

    // Get existing normalized phone numbers for this user
    const { data: existingPhones } = await supabase
      .from('contacts')
      .select('phone_number')
      .eq('user_id', user.id);

    const existingSet = new Set(existingPhones?.map(p => normalizePhoneNumber(p.phone_number)) || []);

    // Filter out contacts with existing phone numbers
    const newContacts = contacts.filter(c => !existingSet.has(c.phone_number));

    if (newContacts.length === 0) {
      toast({
        title: "Import Complete",
        description: `0 contacts imported, ${contacts.length} duplicates skipped`,
      });
      return 0;
    }

    // Use upsert with ON CONFLICT DO NOTHING to handle race conditions
    const { data: insertedData, error } = await supabase
      .from('contacts')
      .upsert(newContacts, {
        onConflict: 'user_id,phone_number',
        ignoreDuplicates: true
      })
      .select();

    if (error) {
      console.error('Upsert error:', error);
      // If upsert fails, try individual inserts with better error handling
      let successCount = 0;
      let duplicateCount = 0;
      
      for (const contact of newContacts) {
        try {
          const { error: insertError } = await supabase
            .from('contacts')
            .insert([contact]);
          
          if (insertError) {
            if (insertError.code === '23505') {
              duplicateCount++;
            } else {
              throw insertError;
            }
          } else {
            successCount++;
          }
        } catch (err) {
          console.error('Individual insert error:', err);
          throw err;
        }
      }
      
      toast({
        title: "Import Complete",
        description: `${successCount} contacts imported, ${duplicateCount + (contacts.length - newContacts.length)} duplicates skipped`,
      });
      
      return successCount;
    }

    const skipped = contacts.length - (insertedData?.length || 0);
    if (skipped > 0) {
      toast({
        title: "Import Complete",
        description: `${insertedData?.length || 0} contacts imported, ${skipped} duplicates skipped`,
      });
    }
    
    return insertedData?.length || 0;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file (.csv extension required)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const text = await file.text();
      
      // Validate CSV format
      const formatValidation = validateCSVFormat(text);
      if (!formatValidation.isValid) {
        throw new Error(`CSV Format Errors:\n${formatValidation.errors.join('\n')}`);
      }

      // Parse CSV
      const { data, errors: parseErrors } = parseCSV(text);
      if (parseErrors.length > 0) {
        throw new Error(`CSV Parse Errors:\n${parseErrors.join('\n')}`);
      }
      
      if (data.length === 0) {
        throw new Error('No valid data found in the CSV file');
      }

      // Validate data content
      const dataValidation = validateCSVData(data);
      if (!dataValidation.isValid) {
        throw new Error(`Data Validation Errors:\n${dataValidation.errors.join('\n')}`);
      }

      // Process import if all validations pass
      const importedCount = await processImportData(data);
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${importedCount} contacts`,
      });

      onImportSuccess();
    } catch (error: any) {
      console.error('Import error:', error);
      
      // Display detailed error message
      const errorMessage = error.message || "Failed to import contacts";
      const isValidationError = errorMessage.includes('Format Errors') || 
                               errorMessage.includes('Parse Errors') || 
                               errorMessage.includes('Validation Errors');
      
      toast({
        title: isValidationError ? "Import Validation Failed" : "Import Failed",
        description: errorMessage.length > 200 
          ? errorMessage.substring(0, 200) + "..."
          : errorMessage,
        variant: "destructive",
      });
      
      // Log full error for debugging
      if (isValidationError) {
        console.warn("CSV Validation Details:", errorMessage);
      }
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
          <Button variant="outline" disabled={isExporting || isImporting} className="flex items-center justify-center gap-2 w-full">
            <Settings className="h-4 w-4" />
            <span>Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background border shadow-md z-50">
          <DropdownMenuItem 
            onClick={() => handleExport('csv')}
            className="cursor-pointer hover:bg-muted flex items-center gap-2"
            disabled={isExporting}
          >
            <Download className="h-4 w-4" />
            <span>Export as CSV</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleExport('xls')}
            className="cursor-pointer hover:bg-muted flex items-center gap-2"
            disabled={isExporting}
          >
            <Download className="h-4 w-4" />
            <span>Export as XLS</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={downloadTemplate}
            className="cursor-pointer hover:bg-muted flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Download Template CSV</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={triggerFileUpload}
            className="cursor-pointer hover:bg-muted flex items-center gap-2"
            disabled={isImporting}
          >
            <Upload className="h-4 w-4" />
            <span>Upload CSV</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};