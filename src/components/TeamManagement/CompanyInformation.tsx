
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Mail, Phone, Globe, MapPin, CreditCard } from 'lucide-react';
import { Team } from '@/types/team';

interface CompanyInformationProps {
  team: Team;
}

export const CompanyInformation: React.FC<CompanyInformationProps> = ({ team }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Company Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {team.company_legal_name && (
            <div>
              <label className="text-sm font-medium text-gray-600">Legal Name</label>
              <p className="font-medium">{team.company_legal_name}</p>
            </div>
          )}
          {team.tax_id && (
            <div>
              <label className="text-sm font-medium text-gray-600">Tax ID</label>
              <p className="font-medium">{team.tax_id}</p>
            </div>
          )}
        </div>

        {(team.company_address || team.city || team.state || team.postal_code || team.country) && (
          <div>
            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Address
            </label>
            <div className="space-y-1">
              {team.company_address && <p>{team.company_address}</p>}
              <p>
                {[team.city, team.state, team.postal_code, team.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {team.company_email && (
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <p>{team.company_email}</p>
            </div>
          )}
          {team.company_phone && (
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Phone
              </label>
              <p>{team.company_phone}</p>
            </div>
          )}
          {team.website && (
            <div>
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Website
              </label>
              <a href={team.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {team.website}
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
