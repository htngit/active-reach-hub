
import { useTeamData } from '@/hooks/useTeamData';
import { useLeadsStats } from '@/hooks/useLeadsStats';

export const useTeamMembersData = () => {
  const { getTeamMemberNames } = useTeamData();
  const { contacts, engagementData, conversionData, isEngagementQualified, isConversionValidated } = useLeadsStats();

  // Helper function to check if a contact is converted (either by status or invoice validation)
  const isContactConverted = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    
    // Check if contact status is "Converted"
    if (contact && contact.status === 'Converted') {
      console.log(`Contact ${contactId} is converted by status`);
      return true;
    }
    
    // Check if contact has validated conversions through invoices
    const contactEngagements = engagementData.filter(e => e.contact_id === contactId);
    const hasValidatedConversion = contactEngagements.some(engagement => {
      return conversionData.some(conversion => 
        conversion.engagement_id === engagement.id && isConversionValidated(conversion.id)
      );
    });
    
    if (hasValidatedConversion) {
      console.log(`Contact ${contactId} is converted by validated invoice`);
    }
    
    return hasValidatedConversion;
  };

  const getTeamMembersData = (teamId: string) => {
    if (!teamId) return [];
    
    const members = getTeamMemberNames(teamId);
    return members.map(member => {
      // Get contacts owned by this member (either as owner_id or user_id)
      const memberContacts = contacts.filter(c => c.owner_id === member.id || c.user_id === member.id);
      const newLeads = memberContacts.filter(c => c.status === 'New').length;
      
      // Count qualified engagements for this member's contacts
      const memberEngagements = engagementData.filter(engagement => 
        memberContacts.some(contact => contact.id === engagement.contact_id)
      );
      const qualified = memberEngagements.filter(engagement => 
        isEngagementQualified(engagement.id)
      ).length;
      
      // Count converted contacts for this member using our local isContactConverted function
      const converted = memberContacts.filter(contact => 
        isContactConverted(contact.id)
      ).length;
      
      console.log(`Member ${member.name} (${member.id}) stats:`, {
        totalContacts: memberContacts.length,
        memberContactIds: memberContacts.map(c => c.id),
        memberContactStatuses: memberContacts.map(c => ({ id: c.id, status: c.status })),
        newLeads,
        qualified,
        converted,
        contactsWithConvertedStatus: memberContacts.filter(c => c.status === 'Converted').length,
        contactsWithValidatedConversions: memberContacts.filter(contact => {
          const contactEngagements = engagementData.filter(e => e.contact_id === contact.id);
          return contactEngagements.some(engagement => {
            return conversionData.some(conversion => 
              conversion.engagement_id === engagement.id && isConversionValidated(conversion.id)
            );
          });
        }).length
      });
      
      return {
        ...member,
        totalLeads: memberContacts.length,
        newLeads,
        qualified,
        converted,
        conversionRate: memberContacts.length > 0 ? ((converted / memberContacts.length) * 100).toFixed(1) : '0'
      };
    });
  };

  return { getTeamMembersData };
};
