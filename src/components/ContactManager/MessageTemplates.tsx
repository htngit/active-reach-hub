
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MessageTemplateSet {
  id: string;
  title: string;
  associated_label_id: string;
  template_variation_1: string;
  template_variation_2: string;
  template_variation_3: string;
  created_at: string;
}

interface Label {
  id: string;
  name: string;
}

export const MessageTemplates: React.FC = () => {
  const [templateSets, setTemplateSets] = useState<MessageTemplateSet[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    associated_label_id: '',
    template_variation_1: '',
    template_variation_2: '',
    template_variation_3: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchTemplateSets();
    fetchLabels();
  }, [user]);

  const fetchTemplateSets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('message_template_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplateSets(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch template sets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLabels = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('labels')
        .select('id, name')
        .eq('user_id', user.id);

      if (error) throw error;
      setLabels(data || []);
    } catch (error: any) {
      console.error('Error fetching labels:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      associated_label_id: '',
      template_variation_1: '',
      template_variation_2: '',
      template_variation_3: '',
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleEdit = (templateSet: MessageTemplateSet) => {
    setFormData({
      title: templateSet.title,
      associated_label_id: templateSet.associated_label_id,
      template_variation_1: templateSet.template_variation_1,
      template_variation_2: templateSet.template_variation_2,
      template_variation_3: templateSet.template_variation_3,
    });
    setEditingId(templateSet.id);
  };

  const handleSave = async () => {
    if (!user || !formData.title || !formData.associated_label_id || 
        !formData.template_variation_1 || !formData.template_variation_2 || 
        !formData.template_variation_3) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        // Update existing template set
        const { error } = await supabase
          .from('message_template_sets')
          .update({
            title: formData.title,
            associated_label_id: formData.associated_label_id,
            template_variation_1: formData.template_variation_1,
            template_variation_2: formData.template_variation_2,
            template_variation_3: formData.template_variation_3,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Template set updated successfully",
        });
      } else {
        // Create new template set
        const { error } = await supabase
          .from('message_template_sets')
          .insert({
            user_id: user.id,
            title: formData.title,
            associated_label_id: formData.associated_label_id,
            template_variation_1: formData.template_variation_1,
            template_variation_2: formData.template_variation_2,
            template_variation_3: formData.template_variation_3,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Template set created successfully",
        });
      }

      setIsCreating(false);
      setEditingId(null);
      resetForm();
      fetchTemplateSets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save template set",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template set?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('message_template_sets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template set deleted successfully",
      });

      fetchTemplateSets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete template set",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    resetForm();
  };

  const getLabelName = (labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    return label ? label.name : 'Unknown Label';
  };

  if (loading) {
    return <div className="p-4">Loading message templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Message Templates</h2>
        <Button onClick={handleCreate} disabled={isCreating || editingId}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template Set
        </Button>
      </div>

      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Template Set' : 'Create New Template Set'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter template set title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Associated Label *</label>
              <Select
                value={formData.associated_label_id}
                onValueChange={(value) => setFormData({ ...formData, associated_label_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a label" />
                </SelectTrigger>
                <SelectContent>
                  {labels.map(label => (
                    <SelectItem key={label.id} value={label.id}>
                      {label.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Template Variation 1 *</label>
              <Textarea
                value={formData.template_variation_1}
                onChange={(e) => setFormData({ ...formData, template_variation_1: e.target.value })}
                placeholder="Enter first message variation (use {{name}}, {{company}}, etc. for placeholders)"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Template Variation 2 *</label>
              <Textarea
                value={formData.template_variation_2}
                onChange={(e) => setFormData({ ...formData, template_variation_2: e.target.value })}
                placeholder="Enter second message variation"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Template Variation 3 *</label>
              <Textarea
                value={formData.template_variation_3}
                onChange={(e) => setFormData({ ...formData, template_variation_3: e.target.value })}
                placeholder="Enter third message variation"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {templateSets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No template sets created yet. Create your first template set to get started!
          </div>
        ) : (
          templateSets.map(templateSet => (
            <Card key={templateSet.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="font-semibold">{templateSet.title}</h3>
                    <Badge variant="outline">
                      {getLabelName(templateSet.associated_label_id)}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      3 message variations configured
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(templateSet)}
                      disabled={isCreating || editingId}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(templateSet.id)}
                      disabled={isCreating || editingId}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
