import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Building, Clock, MessageCircle, Users, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TemplateSelectionModal } from './TemplateSelectionModal';
import { ContactLabelFilter } from './ContactLabelFilter';
import { PaginationControls } from './PaginationControls';
import { CalculationLoadingDialog, useCalculationLoading } from './CalculationLoadingDialog';
import { Contact } from '@/types/contact';
import { useTemplateCache } from '@/hooks/useTemplateCache';
import { usePaginatedFollowUpCalculations } from '@/hooks/usePaginatedFollowUpCalculations';
import { useCachedContacts } from '@/hooks/useCachedContacts';

/**
 * Extended contact interface for follow-up specific data
 * Reuses existing Contact interface from types
 */
interface FollowUpContact extends Contact {
  last_activity?: string;
}

/**
 * Props for FollowUpTabsPaginated component
 * Maintains compatibility with existing FollowUpTabs interface
 */
interface FollowUpTabsPaginatedProps {
  onSelectContact: (contact: Contact) => void;
}

/**
 * Paginated Follow-up Tabs component
 * Implements lazy loading with pagination for better performance
 * Uses existing UI components and maintains interface compatibility
 */
export const FollowUpTabsPaginated: React.FC<FollowUpTabsPaginatedProps> = ({ onSelectContact }) => {
  const [activeTab, setActiveTab] = useState('needs-approach');
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [templatesPreloaded, setTemplatesPreloaded] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Use cached contacts for label extraction
  const { contacts, loading: contactsLoading } = useCachedContacts();
  
  // Template cache hook for preloading (reuse existing)
  const { preloadAllUserTemplates, isLoading: templatesLoading, isPreloaded } = useTemplateCache();
  
  // Use paginated follow-up calculations
  const {
    needsApproach,
    stale3Days,
    stale7Days,
    stale30Days,
    currentPages,
    pageSize,
    totalPages,
    totalCounts,
    isCalculating,
    isCountLoading,
    addOptimisticActivityToContact,
    setPage,
    refreshData,
  } = usePaginatedFollowUpCalculations(contacts, selectedLabels);
  
  // Refresh handler
  const handleRefresh = () => {
    refreshData();
    toast({
      title: "Refreshing Data",
      description: "Follow-up calculations are being updated...",
    });
  };
  
  // Calculation loading dialog
  const {
    isLoading: showLoadingDialog,
    progress,
    currentStep,
    totalContacts,
    processedContacts,
    startCalculation,
    updateProgress,
    finishCalculation,
  } = useCalculationLoading();
  
  // Extract available labels from contacts (reuse existing logic)
  useEffect(() => {
    if (contacts.length > 0) {
      const labels = new Set<string>();
      contacts.forEach(contact => {
        if (contact.labels) {
          contact.labels.forEach(label => labels.add(label));
        }
      });
      setAvailableLabels(Array.from(labels).sort());
    }
  }, [contacts]);
  
  // Preload templates (reuse existing logic)
  useEffect(() => {
    if (!templatesPreloaded && !templatesLoading && !isPreloaded) {
      preloadAllUserTemplates();
      setTemplatesPreloaded(true);
    }
  }, [templatesPreloaded, templatesLoading, isPreloaded, preloadAllUserTemplates]);
  
  // Show loading dialog during calculation
  useEffect(() => {
    if (isCalculating && !showLoadingDialog) {
      startCalculation(pageSize, 'Calculating follow-up priorities...');
    } else if (!isCalculating && showLoadingDialog) {
      finishCalculation();
    }
  }, [isCalculating, showLoadingDialog, pageSize, startCalculation, finishCalculation]);
  
  // Update progress during calculation
  useEffect(() => {
    if (isCalculating) {
      // Simulate progress updates
      const interval = setInterval(() => {
        updateProgress(Math.min(processedContacts + 5, pageSize), 'Processing contact activities...');
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isCalculating, processedContacts, pageSize, updateProgress]);
  
  /**
   * Handle contact action (call/email)
   * Reuses existing logic with optimistic updates
   */
  const handleContactAction = async (contact: Contact, actionType: 'call' | 'email' | 'template') => {
    if (actionType === 'template') {
      setSelectedContact(contact);
      setShowTemplateModal(true);
      return;
    }
    
    try {
      // Add optimistic activity
      const activity = {
        id: `temp-${Date.now()}`,
        type: actionType,
        details: actionType === 'call' ? 'Phone call made' : 'Email sent',
        timestamp: new Date().toISOString(),
        contact_id: contact.id,
        user_id: contact.user_id,
        isOptimistic: true as const,
        localTimestamp: Date.now(),
      };
      
      addOptimisticActivityToContact(contact.id, activity);
      
      toast({
        title: "Activity Added",
        description: `${actionType === 'call' ? 'Call' : 'Email'} activity recorded for ${contact.name}`,
      });
    } catch (error) {
      console.error('Error adding activity:', error);
      toast({
        title: "Error",
        description: "Failed to record activity. Please try again.",
        variant: "destructive",
      });
    }
  };
  

  
  /**
   * Render contact card
   * Reuses existing contact card design
   */
  const renderContactCard = (contact: FollowUpContact) => (
    <Card key={contact.id} className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectContact(contact)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg">{contact.name}</h3>
            {contact.company && (
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <Building className="w-4 h-4 mr-1" />
                {contact.company}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {contact.labels && contact.labels.map(label => (
              <Badge key={label} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span className="flex items-center">
            <Phone className="w-4 h-4 mr-1" />
            {contact.phone_number}
          </span>
          {contact.email && (
            <span className="flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              {contact.email}
            </span>
          )}
          {contact.last_activity && (
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {new Date(contact.last_activity).toLocaleDateString()}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleContactAction(contact, 'call');
            }}
          >
            <Phone className="w-4 h-4 mr-1" />
            Call
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleContactAction(contact, 'email');
            }}
          >
            <Mail className="w-4 h-4 mr-1" />
            Email
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleContactAction(contact, 'template');
            }}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  
  /**
   * Render tab content with pagination
   */
  const renderTabContent = (contacts: FollowUpContact[], tabKey: keyof typeof totalCounts) => {
    const totalCount = totalCounts[tabKey];
    const totalPagesForTab = totalPages[tabKey];
    const currentPageForTab = currentPages[tabKey];
    
    return (
      <div className="space-y-4">
        {/* Header with count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-semibold">
              {totalCount} {totalCount === 1 ? 'Contact' : 'Contacts'}
            </span>
            {isCountLoading && (
              <Badge variant="secondary">Counting...</Badge>
            )}
          </div>
        </div>
        
        {/* Contact list */}
        <div className="min-h-[400px]">
          {contacts.length > 0 ? (
            contacts.map(renderContactCard)
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {isCalculating ? 'Calculating...' : 'No contacts found for this category.'}
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPagesForTab > 1 && (
          <PaginationControls
            currentPage={currentPageForTab}
            totalPages={totalPagesForTab}
            totalItems={totalCount}
            pageSize={pageSize}
            onPageChange={(page) => setPage(tabKey, page)}
            disabled={isCalculating}
            showPageSizeSelector={true}
            onPageSizeChange={(newPageSize) => {
              // TODO: Implement setPageSize in usePaginatedFollowUpCalculations hook
              console.warn('Page size change not yet implemented in hook');
            }}
          />
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Follow-up Management</h2>
          {(isCalculating || isCountLoading) && (
            <Badge variant="secondary" className="animate-pulse">
              {isCalculating ? 'Calculating...' : 'Loading...'}
            </Badge>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isCalculating || isCountLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${(isCalculating || isCountLoading) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Label Filter */}
      <ContactLabelFilter
        availableLabels={availableLabels}
        selectedLabels={selectedLabels}
        onToggleLabel={(label) => {
          setSelectedLabels(prev => 
            prev.includes(label)
              ? prev.filter(l => l !== label)
              : [...prev, label]
          );
        }}
        onLabelsChanged={() => {}}
      />
      
      {/* Follow-up Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="needs-approach" className="relative">
            Needs Approach
            <Badge variant="secondary" className="ml-2">
              {totalCounts.needsApproach}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="stale-3d" className="relative">
            3+ Days
            <Badge variant="secondary" className="ml-2">
              {totalCounts.stale3Days}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="stale-7d" className="relative">
            7+ Days
            <Badge variant="secondary" className="ml-2">
              {totalCounts.stale7Days}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="stale-30d" className="relative">
            30+ Days
            <Badge variant="secondary" className="ml-2">
              {totalCounts.stale30Days}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="needs-approach">
          {renderTabContent(needsApproach, 'needsApproach')}
        </TabsContent>
        
        <TabsContent value="stale-3d">
          {renderTabContent(stale3Days, 'stale3Days')}
        </TabsContent>
        
        <TabsContent value="stale-7d">
          {renderTabContent(stale7Days, 'stale7Days')}
        </TabsContent>
        
        <TabsContent value="stale-30d">
          {renderTabContent(stale30Days, 'stale30Days')}
        </TabsContent>
      </Tabs>
      
      {/* Template Selection Modal */}
      {selectedContact && (
        <TemplateSelectionModal
          contact={selectedContact}
          open={showTemplateModal}
          onOpenChange={(open) => {
            setShowTemplateModal(open);
            if (!open) {
              setSelectedContact(null);
            }
          }}
          onTemplateUsed={(templateTitle, variationNumber) => {
            // Handle template usage
            const activity = {
              id: `temp-${Date.now()}`,
              type: 'WhatsApp Follow-Up via Template',
              details: `Template "${templateTitle}" (Variation ${variationNumber}) sent`,
              timestamp: new Date().toISOString(),
              contact_id: selectedContact.id,
              user_id: selectedContact.user_id,
              isOptimistic: true as const,
              localTimestamp: Date.now(),
            };
            
            addOptimisticActivityToContact(selectedContact.id, activity);
            
            toast({
              title: "Template Sent",
              description: `Template message sent to ${selectedContact.name}`,
            });
            
            setShowTemplateModal(false);
            setSelectedContact(null);
          }}
        >
          <Button
            variant="ghost"
            className="hidden"
            onClick={() => setShowTemplateModal(true)}
          >
            Open Template Modal
          </Button>
        </TemplateSelectionModal>
      )}
      
      {/* Calculation Loading Dialog */}
      <CalculationLoadingDialog
        isOpen={showLoadingDialog}
        progress={progress}
        currentStep={currentStep}
        totalContacts={totalContacts}
        processedContacts={processedContacts}
      />
    </div>
  );
};