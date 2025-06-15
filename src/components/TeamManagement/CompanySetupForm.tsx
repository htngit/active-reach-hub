
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Building, MapPin, CreditCard, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CompanySetupFormProps {
  onCompanyCreated: () => void;
  onCancel: () => void;
  user: any;
}

interface CompanyFormData {
  // Basic Info
  name: string;
  description: string;
  company_legal_name: string;
  tax_id: string;
  
  // Contact Info
  company_phone: string;
  company_email: string;
  website: string;
  
  // Address
  company_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  
  // Banking
  bank_name: string;
  bank_account: string;
  bank_account_holder: string;
  swift_code: string;
}

export const CompanySetupForm: React.FC<CompanySetupFormProps> = ({
  onCompanyCreated,
  onCancel,
  user
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    description: '',
    company_legal_name: '',
    tax_id: '',
    company_phone: '',
    company_email: '',
    website: '',
    company_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Indonesia',
    bank_name: '',
    bank_account: '',
    bank_account_holder: '',
    swift_code: ''
  });

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateFileType = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(file.type);
  };

  const validateFileSize = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return file.size <= maxSize;
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Selected file:', file.name, file.type, file.size);

    // Validate file type
    if (!validateFileType(file)) {
      toast({
        title: "Error",
        description: "Please upload a valid image file (JPEG, PNG, GIF, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (!validateFileSize(file)) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
      console.log('Logo preview created successfully');
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    // Reset file input
    const fileInput = document.getElementById('logo') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    console.log('Logo removed');
  };

  const uploadLogo = async (teamId: string): Promise<string | null> => {
    if (!logoFile) {
      console.log('No logo file to upload');
      return null;
    }

    setUploadingLogo(true);
    try {
      console.log('Starting logo upload for team:', teamId);
      console.log('File details:', {
        name: logoFile.name,
        type: logoFile.type,
        size: logoFile.size
      });

      const fileExt = logoFile.name.split('.').pop()?.toLowerCase();
      const fileName = `${teamId}/logo-${Date.now()}.${fileExt}`;
      
      console.log('Uploading to storage path:', fileName);
      
      // Check if bucket exists first
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      console.log('Available buckets:', buckets);
      
      if (bucketError) {
        console.error('Error listing buckets:', bucketError);
        throw new Error('Failed to access storage buckets');
      }

      const companyAssetsBucket = buckets?.find(bucket => bucket.id === 'company-assets');
      if (!companyAssetsBucket) {
        console.error('company-assets bucket not found');
        throw new Error('Storage bucket not available. Please contact support.');
      }

      console.log('Found company-assets bucket:', companyAssetsBucket);

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, logoFile, { 
          upsert: true,
          contentType: logoFile.type
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      console.log('Generated public URL:', publicUrl);

      // Verify the file was uploaded by trying to list it
      const { data: files, error: listError } = await supabase.storage
        .from('company-assets')
        .list(teamId);

      if (listError) {
        console.error('Error listing files after upload:', listError);
      } else {
        console.log('Files in team folder after upload:', files);
      }

      return publicUrl;
    } catch (error: any) {
      console.error('Error in uploadLogo function:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Creating company with user:', user.id);
      
      // Create company/team first
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          owner_id: user.id,
          company_legal_name: formData.company_legal_name.trim() || null,
          tax_id: formData.tax_id.trim() || null,
          company_address: formData.company_address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          postal_code: formData.postal_code.trim() || null,
          country: formData.country,
          company_phone: formData.company_phone.trim() || null,
          company_email: formData.company_email.trim() || null,
          website: formData.website.trim() || null,
          bank_name: formData.bank_name.trim() || null,
          bank_account: formData.bank_account.trim() || null,
          bank_account_holder: formData.bank_account_holder.trim() || null,
          swift_code: formData.swift_code.trim() || null,
        })
        .select()
        .single();

      if (teamError) {
        console.error('Error creating team:', teamError);
        throw teamError;
      }

      console.log('Team created successfully:', team);

      // Add owner as team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        console.error('Error adding team member:', memberError);
        throw memberError;
      }

      console.log('Team member added successfully');

      // Upload logo if provided
      let logoUrl = null;
      if (logoFile) {
        console.log('Uploading logo for team:', team.id);
        logoUrl = await uploadLogo(team.id);
        
        if (logoUrl) {
          console.log('Updating team with logo URL:', logoUrl);
          const { error: updateError } = await supabase
            .from('teams')
            .update({ logo_url: logoUrl })
            .eq('id', team.id);

          if (updateError) {
            console.error('Error updating logo URL:', updateError);
            toast({
              title: "Warning",
              description: "Company created but logo upload failed. You can update it later.",
              variant: "destructive",
            });
          } else {
            console.log('Team logo URL updated successfully');
          }
        }
      }

      toast({
        title: "Success",
        description: logoUrl ? "Company created successfully with logo" : "Company created successfully",
      });

      onCompanyCreated();
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create company",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.name.trim() && formData.company_legal_name.trim();
      case 2:
        return formData.company_phone.trim() && formData.company_email.trim();
      case 3:
        return formData.company_address.trim() && formData.city.trim();
      case 4:
        return true; // Banking info is optional
      default:
        return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Setup Your Company</h2>
        <p className="text-gray-600">Step {currentStep} of 4</p>
        <div className="mt-2 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Basic Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Company Display Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter company display name"
              />
            </div>
            <div>
              <Label htmlFor="company_legal_name">Legal Company Name *</Label>
              <Input
                id="company_legal_name"
                value={formData.company_legal_name}
                onChange={(e) => handleInputChange('company_legal_name', e.target.value)}
                placeholder="Enter legal company name"
              />
            </div>
            <div>
              <Label htmlFor="tax_id">Tax ID / NPWP</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => handleInputChange('tax_id', e.target.value)}
                placeholder="Enter tax ID or NPWP"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of your company"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_phone">Company Phone *</Label>
              <Input
                id="company_phone"
                value={formData.company_phone}
                onChange={(e) => handleInputChange('company_phone', e.target.value)}
                placeholder="+62 xxx xxxx xxxx"
              />
            </div>
            <div>
              <Label htmlFor="company_email">Company Email *</Label>
              <Input
                id="company_email"
                type="email"
                value={formData.company_email}
                onChange={(e) => handleInputChange('company_email', e.target.value)}
                placeholder="info@company.com"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.company.com"
              />
            </div>
            <div>
              <Label htmlFor="logo">Company Logo</Label>
              <div className="space-y-3">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                />
                <p className="text-sm text-gray-500">
                  Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                </p>
                {logoPreview && (
                  <div className="relative inline-block">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="h-16 w-16 object-contain rounded border"
                      />
                      <div className="flex-1">
                        <p className="font-medium">Logo Preview</p>
                        <p className="text-sm text-gray-600">{logoFile?.name}</p>
                        <p className="text-xs text-gray-500">
                          {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeLogo}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_address">Address *</Label>
              <Textarea
                id="company_address"
                value={formData.company_address}
                onChange={(e) => handleInputChange('company_address', e.target.value)}
                placeholder="Enter full company address"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State/Province</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State/Province"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  placeholder="Postal Code"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Country"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Banking Information (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => handleInputChange('bank_name', e.target.value)}
                placeholder="Bank name"
              />
            </div>
            <div>
              <Label htmlFor="bank_account">Account Number</Label>
              <Input
                id="bank_account"
                value={formData.bank_account}
                onChange={(e) => handleInputChange('bank_account', e.target.value)}
                placeholder="Account number"
              />
            </div>
            <div>
              <Label htmlFor="bank_account_holder">Account Holder</Label>
              <Input
                id="bank_account_holder"
                value={formData.bank_account_holder}
                onChange={(e) => handleInputChange('bank_account_holder', e.target.value)}
                placeholder="Account holder name"
              />
            </div>
            <div>
              <Label htmlFor="swift_code">SWIFT Code</Label>
              <Input
                id="swift_code"
                value={formData.swift_code}
                onChange={(e) => handleInputChange('swift_code', e.target.value)}
                placeholder="SWIFT/BIC code"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between mt-6">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep} disabled={isSubmitting}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          {currentStep < 4 ? (
            <Button onClick={nextStep} disabled={!isStepValid(currentStep) || isSubmitting}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || uploadingLogo}>
              {isSubmitting ? 'Creating...' : uploadingLogo ? 'Uploading Logo...' : 'Create Company'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
