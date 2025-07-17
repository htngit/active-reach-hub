
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { normalizePhoneNumber, isValidPhoneNumber } from '@/utils/phoneUtils';

interface ImportDropdownProps {
  onImportSuccess: () => void;
}

export const ImportDropdown: React.FC<ImportDropdownProps> = ({ onImportSuccess }) => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const downloadTemplate = () => {
    // Pastikan nama kolom di template sesuai dengan yang diharapkan oleh kode
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

    // Extract all unique labels from imported contacts for later processing
    const allLabels = new Set<string>();
    data.forEach(row => {
      if (row.labels) {
        const labels = row.labels.split(';').map((label: string) => label.trim()).filter(Boolean);
        labels.forEach((label: string) => allLabels.add(label));
      }
    });

    const contacts = data.map(row => {
      const rawPhone = row.phone_number || '';
      const normalizedPhone = normalizePhoneNumber(rawPhone);
      
      return {
        user_id: user.id,
        owner_id: user.id, // Set current user as owner for imported contacts
        name: row.name || '',
        phone_number: normalizedPhone,
        email: row.email || null,
        company: row.company || null,
        address: row.address || null,
        notes: row.notes || null,
        labels: row.labels ? row.labels.split(';').map((label: string) => label.trim()).filter(Boolean) : null,
        status: row.status || 'New',
        potential_product: row.potential_product ? row.potential_product.split(';').map((product: string) => product.trim()).filter(Boolean) : null,
        team_id: null // Default to personal contacts for imports
      };
    }).filter(contact => contact.name && contact.phone_number && isValidPhoneNumber(contact.phone_number));

    if (contacts.length === 0) {
      throw new Error('No valid contacts found in the file');
    }

    // Check for existing normalized phone numbers for the same user to prevent duplicates
    const { data: existingPhones } = await supabase
      .from('contacts')
      .select('phone_number')
      .eq('user_id', user.id);

    const existingSet = new Set(existingPhones?.map(p => normalizePhoneNumber(p.phone_number)) || []);

    // Filter out contacts with phone numbers that already exist for this user
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

    let finalSuccessCount = 0;

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
      
      finalSuccessCount = successCount;
      
      toast({
        title: "Import Complete",
        description: `${successCount} contacts imported, ${duplicateCount + (contacts.length - newContacts.length)} duplicates skipped`,
      });
    } else {
      finalSuccessCount = insertedData?.length || 0;
      
      // Show notification about duplicates if any were skipped
      const skipped = contacts.length - finalSuccessCount;
      if (skipped > 0) {
        toast({
          title: "Import Complete",
          description: `${finalSuccessCount} contacts imported, ${skipped} duplicates skipped`,
        });
      }
    }

    // Only create labels if contacts were successfully imported
    if (finalSuccessCount > 0 && allLabels.size > 0) {
      try {
        // Fetch existing labels to avoid duplicates
        const { data: existingLabelsData } = await supabase
          .from('labels')
          .select('name')
          .eq('user_id', user.id);
        
        const existingLabels = new Set(existingLabelsData?.map(l => l.name) || []);
        
        // Create new labels that don't exist yet
        const newLabels = Array.from(allLabels).filter(label => !existingLabels.has(label));
        
        if (newLabels.length > 0) {
          const labelsToInsert = newLabels.map(name => ({
            user_id: user.id,
            name,
            color: null // Default color
          }));
          
          const { error: labelInsertError } = await supabase
            .from('labels')
            .insert(labelsToInsert);
          
          if (labelInsertError) {
            console.error('Error inserting new labels:', labelInsertError);
            // Don't throw error, just log it since contacts were already imported
          }
        }
      } catch (labelError) {
        console.error('Error processing labels after successful import:', labelError);
        // Don't throw error since contacts were successfully imported
      }
    }

    return finalSuccessCount;
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
          <Button variant="outline" disabled={isImporting}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white border shadow-md">
          <DropdownMenuItem 
            onClick={downloadTemplate}
            className="cursor-pointer hover:bg-gray-100"
          >
            Download Template CSV
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={triggerFileUpload}
            className="cursor-pointer hover:bg-gray-100"
          >
            Upload CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
