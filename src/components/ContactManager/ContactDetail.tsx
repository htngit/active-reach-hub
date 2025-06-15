import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Save, X, Phone, Mail, Building, MapPin, Calendar, MessageSquare, User, Trash2, MessageCircle, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { LeadQualificationForm } from './LeadQualificationForm';
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
  user_id: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
  };
}

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
  onContactUpdated: () => void;
}

const statusOptions = ['New', 'Approached', 'Follow-up Required', 'Paid', 'Lost'];
const activityTypes = ['WhatsApp Attempt', 'Call Logged', 'Email Sent', 'Meeting Note'];

export const ContactDetail: React.FC<ContactDetailProps> = ({
  contact: initialContact,
  onBack,
  onContactUpdated,
}) => {
  const [contact, setContact] = useState(initialContact);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(contact);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState({ type: '', details: '' });
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState(contact.status);
  const { user } = useAuth();

  useEffect(() => {
    setContact(initialContact);
    setEditedContact(initialContact);
    setNewStatus(initialContact.status);
  }, [initialContact]);

  useEffect(() => {
    fetchActivities();
    fetchLabels();
  }, [contact.id]);

  const fetchActivities = async () => {
    if (!user) return;

    try {
      // Fetch all activities for this contact
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('contact_id', contact.id)
        .order('timestamp', { ascending: false });

      if (activitiesError) throw activitiesError;
      
      // If we have activities, fetch the profile information separately
      if (activitiesData && activitiesData.length > 0) {
        // Get unique user_ids from activities
        const userIds = [...new Set(activitiesData.map(activity => activity.user_id))];
        
        // Fetch profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', userIds);
          
        if (profilesError) throw profilesError;
        
        // Create a map of user_id to profile data
        const profilesMap = (profilesData || []).reduce((map, profile) => {
          map[profile.id] = profile;
          return map;
        }, {} as Record<string, any>);
        
        // Combine activities with profile data
        const activitiesWithProfiles = activitiesData.map(activity => ({
          ...activity,
          profiles: profilesMap[activity.user_id] || null
        }));
        
        setActivities(activitiesWithProfiles);
      } else {
        setActivities([]);
      }
    } catch (error: any) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch activities: " + (error.message || JSON.stringify(error)),
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

  const autoUpdateStatusToApproached = async () => {
    if (contact.status === 'New' && activities.length > 0) {
      try {
        // Simple direct update without any RLS functions
        const { error } = await supabase
          .from('contacts')
          .update({ status: 'Approached' })
          .eq('id', contact.id);
          
        if (error) throw error;

        setContact({ ...contact, status: 'Approached' });
        setNewStatus('Approached');
        
        toast.success("Contact status automatically changed to 'Approached' due to activity history");

        onContactUpdated();
      } catch (error: any) {
        console.error('Failed to auto-update status:', error);
      }
    }
  };

  const handleWhatsAppContact = async () => {
    if (!user) return;

    try {
      // Format phone number for wa.me
      const formattedPhone = formatPhoneNumber(contact.phone_number);
      
      // Create WhatsApp URL without message (direct contact)
      const whatsappUrl = `https://wa.me/${formattedPhone}`;
      
      // Log activity to database
      const { error } = await supabase
        .from('activities')
        .insert({
          contact_id: contact.id,
          user_id: user.id,
          type: 'WhatsApp Direct Contact',
          details: `Direct WhatsApp contact to ${contact.phone_number}`,
          timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error('Failed to log activity:', error);
      }

      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      toast.success(`WhatsApp opened for ${contact.name}`);

      // Refresh activities and check for auto status update
      await fetchActivities();
      await autoUpdateStatusToApproached();
    } catch (error: any) {
      // Log failed attempt
      await supabase
        .from('activities')
        .insert({
          contact_id: contact.id,
          user_id: user?.id,
          type: 'WhatsApp Direct Contact',
          details: `Failed WhatsApp attempt: ${error.message}`,
          timestamp: new Date().toISOString(),
        });

      toast.error("Failed to open WhatsApp");

      fetchActivities();
    }
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If starts with +, remove it
    if (phoneNumber.startsWith('+')) {
      cleaned = phoneNumber.substring(1).replace(/\D/g, '');
    }
    
    // If starts with 0, replace with country code (assuming Indonesia +62)
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    
    return cleaned;
  };

  const handleSaveContact = async () => {
    if (!user) {
      toast.error("You must be logged in to update contacts");
      return;
    }

    try {
      console.log('Updating contact with data:', editedContact);

      // Simple direct update without any complex RLS or functions
      const { error } = await supabase
        .from('contacts')
        .update({
          name: editedContact.name,
          phone_number: editedContact.phone_number,
          email: editedContact.email || null,
          company: editedContact.company || null,
          address: editedContact.address || null,
          notes: editedContact.notes || null,
          labels: editedContact.labels && editedContact.labels.length > 0 ? editedContact.labels : null,
          status: editedContact.status,
          potential_product: editedContact.potential_product && editedContact.potential_product.length > 0 ? editedContact.potential_product : null,
        })
        .eq('id', contact.id);

      if (error) {
        console.error('Supabase error updating contact:', error);
        throw error;
      }

      setContact(editedContact);
      setNewStatus(editedContact.status);

      toast.success("Contact updated successfully");

      setIsEditing(false);
      onContactUpdated();
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast.error(error.message || "Failed to update contact");
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.type || !user) return;

    try {
      const { error } = await supabase
        .from('activities')
        .insert({
          contact_id: contact.id,
          user_id: user.id,
          type: newActivity.type,
          details: newActivity.details || null,
          timestamp: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Activity logged successfully");

      setNewActivity({ type: '', details: '' });
      setShowAddActivity(false);
      
      // Refresh activities and check for auto status update
      await fetchActivities();
      await autoUpdateStatusToApproached();
    } catch (error: any) {
      console.error('Error adding activity:', error);
      toast.error(error.message || "Failed to log activity");
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
    if (!newLabel.trim() || !user) return;

    try {
      // Create label in database
      const { error } = await supabase
        .from('labels')
        .insert({
          name: newLabel.trim(),
          user_id: user.id,
        });

      if (error && error.code !== '23505') { // Ignore unique constraint error
        throw error;
      }

      // Add to contact
      addLabel(newLabel.trim());
      setAvailableLabels([...availableLabels, newLabel.trim()]);
      setNewLabel('');
    } catch (error: any) {
      console.error('Error creating label:', error);
      toast.error(error.message || "Failed to create label");
    }
  };

  const handleStatusUpdate = async () => {
    if (newStatus === contact.status) {
      setIsUpdatingStatus(false);
      return;
    }

    if (!user) {
      toast.error("You must be logged in to update contact status");
      return;
    }

    try {
      console.log('Updating contact status:', { contactId: contact.id, newStatus, userId: user.id });

      // Simple direct update without any RLS functions or complex queries
      const { error } = await supabase
        .from('contacts')
        .update({ status: newStatus })
        .eq('id', contact.id);

      if (error) {
        console.error('Supabase error updating status:', error);
        throw error;
      }

      // Update local state immediately
      setContact({ ...contact, status: newStatus });

      toast.success("Contact status updated successfully");

      setIsUpdatingStatus(false);
      onContactUpdated();
    } catch (error: any) {
      console.error('Error updating contact status:', error);
      toast.error(error.message || "Failed to update contact status");
      // Reset the status to original value on error
      setNewStatus(contact.status);
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!user) {
      toast.error("You must be logged in to delete contacts");
      return;
    }

    try {
      console.log('Deleting contact:', contact.id);

      // Delete the contact - cascading deletes will handle related data
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) {
        console.error('Supabase error deleting contact:', error);
        throw error;
      }

      toast.success("Contact deleted successfully");

      // Go back to contact list and refresh
      onContactUpdated();
      onBack();
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast.error(error.message || "Failed to delete contact");
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
            <>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{contact.name}"? This action cannot be undone. 
                      All activities, invoices, and related data for this contact will also be deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteContact}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Contact
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
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

      {/* Lead Qualification Section */}
      <LeadQualificationForm 
        contactId={contact.id}
        contactName={contact.name}
        currentStatus={contact.status}
        onQualificationUpdate={onContactUpdated}
      />

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
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="mb-2">{contact.status}</Badge>
                    {!isUpdatingStatus ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsUpdatingStatus(true)}
                      >
                        <h5 className="text-xs font-normal italic">Update Status</h5>
                        <Edit className="h-3 w-3" />
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(status => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleStatusUpdate}>
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setIsUpdatingStatus(false);
                            setNewStatus(contact.status);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
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
              <Button 
                variant="outline" 
                onClick={() => window.location.href = `/invoices?contact=${contact.id}`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{activity.type}</h4>
                        {activity.user_id !== user?.id && (
                          <Badge variant="outline" className="text-xs">
                            {activity.profiles?.full_name || activity.profiles?.username || 'Team member'}
                          </Badge>
                        )}
                      </div>
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
