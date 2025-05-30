import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Phone, Mail, Building, MapPin, MessageCircle, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TemplateSelectionModal } from './TemplateSelectionModal';

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

interface Activity {
  id: string;
  type: string;
  details?: string;
  timestamp: string;
  api_call_status?: string;
}

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
  onContactUpdated: () => void;
}

const statusOptions = ['New', 'Approached', 'Follow-up Required', 'Paid', 'Lost'];
const activityTypes = ['WhatsApp Attempt', 'Call Logged', 'Email Sent', 'Meeting Note'];

export const ContactDetail: React.FC<ContactDetailProps> = ({
  contact,
  onBack,
  onContactUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(contact);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState({ type: '', details: '' });
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchActivities();
    fetchLabels();
  }, [contact.id]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('contact_id', contact.id)
        .eq('user_id', user?.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch activities",
        variant: "destructive",
      });
    }
  };

  const fetchLabels = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('labels')
        .select('name')
        .eq('user_id', user.id);

      if (error) throw error;
      setAvailableLabels(data?.map(label => label.name) || []);
    } catch (error: any) {
      console.error('Error fetching labels:', error);
    }
  };

  const handleWhatsAppContact = async () => {
    try {
      // Make API call to custom endpoint
      const response = await fetch(`https://example.com/api/initiate-whatsapp?phone=${contact.phone_number}`);
      const result = await response.json();

      // Log activity
      const { error } = await supabase
        .from('activities')
        .insert({
          contact_id: contact.id,
          user_id: user?.id,
          type: 'WhatsApp Attempt',
          details: `WhatsApp contact attempt for ${contact.phone_number}`,
          api_call_status: result.success ? 'success' : 'failure',
          timestamp: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: result.success ? "Success" : "Warning",
        description: result.message || "WhatsApp contact attempted",
        variant: result.success ? "default" : "destructive",
      });

      fetchActivities();
    } catch (error: any) {
      // Log failed attempt
      await supabase
        .from('activities')
        .insert({
          contact_id: contact.id,
          user_id: user?.id,
          type: 'WhatsApp Attempt',
          details: `Failed WhatsApp attempt: ${error.message}`,
          api_call_status: 'failure',
          timestamp: new Date().toISOString(),
        });

      toast({
        title: "Error",
        description: "WhatsApp contact failed - logged as activity",
        variant: "destructive",
      });

      fetchActivities();
    }
  };

  const handleSaveContact = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({
          name: editedContact.name,
          phone_number: editedContact.phone_number,
          email: editedContact.email,
          company: editedContact.company,
          address: editedContact.address,
          notes: editedContact.notes,
          labels: editedContact.labels,
          status: editedContact.status,
          potential_product: editedContact.potential_product,
        })
        .eq('id', contact.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact updated successfully",
      });

      setIsEditing(false);
      onContactUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive",
      });
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.type) return;

    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          contact_id: contact.id,
          user_id: user?.id,
          type: newActivity.type,
          details: newActivity.details,
          timestamp: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity logged successfully",
      });

      setNewActivity({ type: '', details: '' });
      setShowAddActivity(false);
      fetchActivities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to log activity",
        variant: "destructive",
      });
    }
  };

  const addLabel = (label: string) => {
    if (!editedContact.labels?.includes(label)) {
      setEditedContact({
        ...editedContact,
        labels: [...(editedContact.labels || []), label]
      });
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setEditedContact({
      ...editedContact,
      labels: editedContact.labels?.filter(label => label !== labelToRemove) || []
    });
  };

  const createAndAddLabel = async () => {
    if (!newLabel.trim()) return;

    try {
      // Create label in database
      const { error } = await supabase
        .from('labels')
        .insert({
          name: newLabel,
          user_id: user?.id,
        });

      if (error && error.code !== '23505') { // Ignore unique constraint error
        throw error;
      }

      // Add to contact
      addLabel(newLabel);
      setAvailableLabels([...availableLabels, newLabel]);
      setNewLabel('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create label",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to Contacts
        </Button>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <>
              <Button onClick={handleSaveContact}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                setEditedContact(contact);
              }}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={editedContact.name}
                  onChange={(e) => setEditedContact({ ...editedContact, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <Input
                  value={editedContact.phone_number}
                  onChange={(e) => setEditedContact({ ...editedContact, phone_number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  value={editedContact.email || ''}
                  onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <Input
                  value={editedContact.company || ''}
                  onChange={(e) => setEditedContact({ ...editedContact, company: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <Input
                  value={editedContact.address || ''}
                  onChange={(e) => setEditedContact({ ...editedContact, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={editedContact.status}
                  onValueChange={(value) => setEditedContact({ ...editedContact, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <Textarea
                  value={editedContact.notes || ''}
                  onChange={(e) => setEditedContact({ ...editedContact, notes: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Labels</label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {editedContact.labels?.map(label => (
                      <Badge key={label} variant="secondary" className="flex items-center gap-1">
                        {label}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeLabel(label)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Select onValueChange={addLabel}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Add existing label" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLabels.filter(label => !editedContact.labels?.includes(label)).map(label => (
                          <SelectItem key={label} value={label}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Create new label"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                    />
                    <Button onClick={createAndAddLabel}>Add</Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{contact.name}</h2>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    {contact.phone_number}
                  </div>
                  {contact.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      {contact.email}
                    </div>
                  )}
                  {contact.company && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building className="h-4 w-4" />
                      {contact.company}
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {contact.address}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-2">{contact.status}</Badge>
                  {contact.labels && contact.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contact.labels.map(label => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {contact.notes && (
                <div>
                  <h3 className="font-medium mb-1">Notes</h3>
                  <p className="text-gray-600">{contact.notes}</p>
                </div>
              )}
              {contact.potential_product && contact.potential_product.length > 0 && (
                <div>
                  <h3 className="font-medium mb-1">Potential Products</h3>
                  <div className="flex flex-wrap gap-1">
                    {contact.potential_product.map(product => (
                      <Badge key={product} variant="outline">{product}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleWhatsAppContact}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact via WhatsApp
              </Button>
              <TemplateSelectionModal contact={contact}>
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Template Follow Up
                </Button>
              </TemplateSelectionModal>
              <Button variant="outline" onClick={() => setShowAddActivity(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Log Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddActivity && (
        <Card>
          <CardHeader>
            <CardTitle>Log New Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={newActivity.type}
              onValueChange={(value) => setNewActivity({ ...newActivity, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Activity details (optional)"
              value={newActivity.details}
              onChange={(e) => setNewActivity({ ...newActivity, details: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={handleAddActivity}>Log Activity</Button>
              <Button variant="outline" onClick={() => setShowAddActivity(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-gray-500">No activities logged yet</p>
          ) : (
            <div className="space-y-4">
              {activities.map(activity => (
                <div key={activity.id} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{activity.type}</h4>
                      {activity.details && (
                        <p className="text-gray-600 text-sm">{activity.details}</p>
                      )}
                      {activity.api_call_status && (
                        <Badge 
                          variant={activity.api_call_status === 'success' ? 'default' : 'destructive'}
                          className="text-xs mt-1"
                        >
                          {activity.api_call_status}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
