
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LogoSectionProps {
  team: any;
  onLogoUpdated: () => void;
  updating: boolean;
}

export const LogoSection: React.FC<LogoSectionProps> = ({
  team,
  onLogoUpdated,
  updating
}) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
    const fileInput = document.getElementById('edit-logo') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    console.log('Logo removed');
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) {
      console.log('No logo file to upload');
      return null;
    }

    setUploadingLogo(true);
    try {
      console.log('Starting logo upload for team:', team.id);
      console.log('File details:', {
        name: logoFile.name,
        type: logoFile.type,
        size: logoFile.size
      });

      const fileExt = logoFile.name.split('.').pop()?.toLowerCase();
      const fileName = `${team.id}/logo-${Date.now()}.${fileExt}`;
      
      console.log('Uploading to storage path:', fileName);
      
      // Upload file to storage with retry logic
      let uploadData, uploadError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Upload attempt ${attempt}`);
        
        const result = await supabase.storage
          .from('company-assets')
          .upload(fileName, logoFile, { 
            upsert: true,
            contentType: logoFile.type
          });

        uploadData = result.data;
        uploadError = result.error;

        if (!uploadError) {
          console.log('Upload successful on attempt', attempt);
          break;
        } else {
          console.error(`Upload attempt ${attempt} failed:`, uploadError);
          if (attempt === 3) {
            throw new Error(`Upload failed after 3 attempts: ${uploadError.message}`);
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      if (uploadError) {
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      console.log('Generated public URL:', publicUrl);

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

  const handleUpdateLogo = async () => {
    if (!logoFile) {
      toast({
        title: "Error",
        description: "Please select a logo file first",
        variant: "destructive",
      });
      return;
    }

    try {
      const logoUrl = await uploadLogo();
      
      if (logoUrl) {
        console.log('Updating team with logo URL:', logoUrl);
        const { error: updateError } = await supabase
          .from('teams')
          .update({ logo_url: logoUrl })
          .eq('id', team.id);

        if (updateError) {
          console.error('Error updating logo URL:', updateError);
          toast({
            title: "Error",
            description: "Failed to update logo. Please try again.",
            variant: "destructive",
          });
        } else {
          console.log('Team logo URL updated successfully');
          toast({
            title: "Success",
            description: "Logo updated successfully",
          });
          onLogoUpdated();
          // Clear the preview and file
          setLogoFile(null);
          setLogoPreview(null);
          const fileInput = document.getElementById('edit-logo') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }
      }
    } catch (error: any) {
      console.error('Error updating logo:', error);
      toast({
        title: "Error",
        description: "Failed to update logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCurrentLogo = async () => {
    try {
      const { error: updateError } = await supabase
        .from('teams')
        .update({ logo_url: null })
        .eq('id', team.id);

      if (updateError) {
        console.error('Error removing logo:', updateError);
        toast({
          title: "Error",
          description: "Failed to remove logo. Please try again.",
          variant: "destructive",
        });
      } else {
        console.log('Team logo removed successfully');
        toast({
          title: "Success",
          description: "Logo removed successfully",
        });
        onLogoUpdated();
      }
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast({
        title: "Error",
        description: "Failed to remove logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Company Logo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Logo Display */}
        {team.logo_url && (
          <div className="space-y-3">
            <Label>Current Logo</Label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
              <img 
                src={team.logo_url} 
                alt="Current company logo" 
                className="h-16 w-16 object-contain rounded border"
              />
              <div className="flex-1">
                <p className="font-medium">Current Company Logo</p>
                <p className="text-sm text-gray-600">Click "Remove" to delete this logo</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveCurrentLogo}
                disabled={updating || uploadingLogo}
              >
                Remove
              </Button>
            </div>
          </div>
        )}

        {/* Upload New Logo */}
        <div className="space-y-3">
          <Label htmlFor="edit-logo">Upload New Logo</Label>
          <Input
            id="edit-logo"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            disabled={updating || uploadingLogo}
          />
          <p className="text-sm text-gray-500">
            Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
          </p>

          {/* New Logo Preview */}
          {logoPreview && (
            <div className="space-y-3">
              <Label>New Logo Preview</Label>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <img 
                  src={logoPreview} 
                  alt="New logo preview" 
                  className="h-16 w-16 object-contain rounded border"
                />
                <div className="flex-1">
                  <p className="font-medium">New Logo Preview</p>
                  <p className="text-sm text-gray-600">{logoFile?.name}</p>
                  <p className="text-xs text-gray-500">
                    {logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUpdateLogo}
                    disabled={updating || uploadingLogo}
                  >
                    {uploadingLogo ? 'Uploading...' : 'Update Logo'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={removeLogo}
                    disabled={updating || uploadingLogo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
