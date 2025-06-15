
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCachedContacts } from '@/hooks/useCachedContacts';

export const useLeadsStats = () => {
  const { contacts, refetch: refetchContacts } = useCachedContacts();
  const [refreshing, setRefreshing] = useState(false);
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [conversionData, setConversionData] = useState<any[]>([]);

  // Fetch engagement and conversion data
  const fetchEngagementData = async () => {
    try {
      // Fetch engagements with qualification scores
      const { data: engagements, error: engError } = await supabase
        .from('engagements')
        .select(`
          id,
          status,
          contact_id,
          qualification_criteria (
            qualification_score
          )
        `);

      if (engError) {
        console.error('Error fetching engagement data:', engError);
        return;
      }

      // Fetch conversion data with invoice validation
      const { data: conversions, error: convError } = await supabase
        .from('engagement_conversions')
        .select(`
          id,
          engagement_id,
          invoice_id,
          converted_at,
          invoices (
            status,
            total
          )
        `);

      if (convError) {
        console.error('Error fetching conversion data:', convError);
        return;
      }

      setEngagementData(engagements || []);
      setConversionData(conversions || []);
    } catch (error) {
      console.error('Error fetching engagement data:', error);
    }
  };

  // Function to manually refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchContacts();
      await fetchEngagementData();
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh on mount to ensure latest data
  useEffect(() => {
    refetchContacts();
    fetchEngagementData();
  }, [refetchContacts]);

  // Helper function to check if an engagement is qualified based on BANT score
  const isEngagementQualified = (engagementId: string) => {
    const engagement = engagementData.find(e => e.id === engagementId);
    if (!engagement || !engagement.qualification_criteria || engagement.qualification_criteria.length === 0) {
      return false;
    }
    return engagement.qualification_criteria[0].qualification_score >= 75;
  };

  // Helper function to check if a contact is qualified by BANT (legacy support)
  const isContactQualifiedByBANT = (contactId: string) => {
    // Check if any engagement for this contact is qualified
    const contactEngagements = engagementData.filter(e => e.contact_id === contactId);
    return contactEngagements.some(engagement => isEngagementQualified(engagement.id));
  };

  // Helper function to check if a conversion is validated by a paid invoice
  const isConversionValidated = (conversionId: string) => {
    const conversion = conversionData.find(c => c.id === conversionId);
    return conversion && conversion.invoices && conversion.invoices.status === 'Paid';
  };

  // Helper function to check if a contact is converted (either by status or invoice validation)
  const isContactConverted = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    
    // Check if contact status is "Converted"
    if (contact && contact.status === 'Converted') {
      return true;
    }
    
    // Check if contact has validated conversions through invoices
    const contactEngagements = engagementData.filter(e => e.contact_id === contactId);
    const hasValidatedConversion = contactEngagements.some(engagement => {
      return conversionData.some(conversion => 
        conversion.engagement_id === engagement.id && isConversionValidated(conversion.id)
      );
    });
    
    return hasValidatedConversion;
  };

  // Function to get leads distribution stats with enhanced conversion counting
  const getLeadsStats = () => {
    const totalContacts = contacts.length;
    const newLeads = contacts.filter(c => c.status === 'New').length;
    
    // Count qualified engagements (BANT score >= 75%)
    const qualifiedEngagements = engagementData.filter(engagement => 
      isEngagementQualified(engagement.id)
    ).length;
    
    // Count converted contacts (either by status or validated conversions)
    const convertedContacts = contacts.filter(contact => 
      isContactConverted(contact.id)
    ).length;

    // Calculate total revenue from validated conversions
    const totalRevenue = conversionData
      .filter(conversion => isConversionValidated(conversion.id))
      .reduce((sum, conversion) => sum + (conversion.invoices?.total || 0), 0);

    console.log('Enhanced leads stats (including status-based conversions):', {
      totalContacts,
      newLeads,
      qualifiedEngagements,
      convertedContacts,
      totalRevenue,
      engagementCount: engagementData.length,
      conversionCount: conversionData.length
    });

    return {
      total: totalContacts,
      new: newLeads,
      qualified: qualifiedEngagements,
      converted: convertedContacts,
      totalRevenue,
      conversionRate: totalContacts > 0 ? ((convertedContacts / totalContacts) * 100).toFixed(1) : '0',
      qualificationRate: engagementData.length > 0 ? ((qualifiedEngagements / engagementData.length) * 100).toFixed(1) : '0'
    };
  };

  return {
    contacts,
    engagementData,
    conversionData,
    refreshing,
    handleRefresh,
    isEngagementQualified,
    isContactQualifiedByBANT,
    isConversionValidated,
    getLeadsStats
  };
};
