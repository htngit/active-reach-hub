
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { Team } from '@/types/team';

interface BankingInformationProps {
  team: Team;
}

export const BankingInformation: React.FC<BankingInformationProps> = ({ team }) => {
  // Only render if there's banking information to show
  if (!team.bank_name && !team.bank_account && !team.bank_account_holder && !team.swift_code) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Banking Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {team.bank_name && (
            <div>
              <label className="text-sm font-medium text-gray-600">Bank Name</label>
              <p className="font-medium">{team.bank_name}</p>
            </div>
          )}
          {team.bank_account && (
            <div>
              <label className="text-sm font-medium text-gray-600">Account Number</label>
              <p className="font-medium">{team.bank_account}</p>
            </div>
          )}
          {team.bank_account_holder && (
            <div>
              <label className="text-sm font-medium text-gray-600">Account Holder</label>
              <p className="font-medium">{team.bank_account_holder}</p>
            </div>
          )}
          {team.swift_code && (
            <div>
              <label className="text-sm font-medium text-gray-600">SWIFT Code</label>
              <p className="font-medium">{team.swift_code}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
