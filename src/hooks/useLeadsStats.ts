
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCachedContacts } from '@/hooks/useCachedContacts';

export const useLeadsStats = () => {
  const { contacts, refetch: refetchContacts } = useCachedContacts();
  const [refreshing, setRefreshing] = useState(false);
  const [qualificationData, setQualificationData] = useState<any[]>([]);

  // Fetch qualification criteria data
  const fetchQualificationData = async () => {
    try {
      const { data, error } = await supabase
        .from('qualification_criteria')
        .select('contact_id, qualification_score');

      if (error) {
        console.error('Error fetching qualification data:', error);
        return;
      }

      setQualificationData(data || []);
    } catch (error) {
      console.error('Error fetching qualification data:', error);
    }
  };

  // Function to manually refresh the contacts data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchContacts();
      await fetchQualificationData();
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh on mount to ensure latest data
  useEffect(() => {
    refetchContacts();
    fetchQualificationData();
  }, [refetchContacts]);

  // Helper function to check if a contact is qualified based on BANT score
  const isContactQualifiedByBANT = (contactId: string) => {
    const qualificationRecord = qualificationData.find(q => q.contact_id === contactId);
    return qualificationRecord ? qualificationRecord.qualification_score >= 75 : false;
  };

  // Function to get leads distribution stats
  const getLeadsStats = () => {
    const totalContacts = contacts.length;
    const newLeads = contacts.filter(c => c.status === 'New').length;
    
    // Count qualified leads based on BANT qualification score (75% or higher)
    const qualifiedLeads = contacts.filter(c => isContactQualifiedByBANT(c.id)).length;
    
    const convertedLeads = contacts.filter(c => c.status === 'Converted').length;

    console.log('Contacts breakdown:', {
      total: totalContacts,
      new: newLeads,
      qualified: qualifiedLeads,
      converted: convertedLeads,
      qualificationData: qualificationData.length
    });

    return {
      total: totalContacts,
      new: newLeads,
      qualified: qualifiedLeads,
      converted: convertedLeads,
      conversionRate: totalContacts > 0 ? ((convertedLeads / totalContacts) * 100).toFixed(1) : '0'
    };
  };

  return {
    contacts,
    refreshing,
    qualificationData,
    handleRefresh,
    isContactQualifiedByBANT,
    getLeadsStats
  };
};
