
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Skeleton } from '@/components/ui/skeleton';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
];

export const CurrencySettings: React.FC = () => {
  const { settings, loading, updateCurrency } = useSystemSettings();
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleCurrencyChange = async () => {
    if (!selectedCurrency) return;

    setUpdating(true);
    await updateCurrency(selectedCurrency);
    setUpdating(false);
    setSelectedCurrency('');
  };

  const currentCurrency = CURRENCIES.find(c => c.code === settings?.currency);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-[300px]" />
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Current Currency</h3>
          <p className="text-sm text-gray-600">
            This currency will be used throughout the application for invoices, products, and financial displays.
          </p>
        </div>

        {currentCurrency && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold">{currentCurrency.symbol}</div>
                  <div>
                    <div className="font-medium">{currentCurrency.name}</div>
                    <Badge variant="outline">{currentCurrency.code}</Badge>
                  </div>
                </div>
                <Badge>Current</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Change Currency</h3>
        
        <div className="flex gap-3">
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a new currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((currency) => (
                <SelectItem 
                  key={currency.code} 
                  value={currency.code}
                  disabled={currency.code === settings?.currency}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{currency.symbol}</span>
                    <span>{currency.name}</span>
                    <Badge variant="outline" className="ml-auto">
                      {currency.code}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleCurrencyChange}
            disabled={!selectedCurrency || updating}
          >
            {updating ? 'Updating...' : 'Update Currency'}
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Impact of Currency Change</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All new invoices will use the selected currency</li>
          <li>• Product prices will be displayed in the new currency</li>
          <li>• Financial reports will show amounts in the selected currency</li>
          <li>• Existing data currency display will be updated</li>
        </ul>
      </div>
    </div>
  );
};
