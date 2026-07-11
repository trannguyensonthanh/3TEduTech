/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/ExchangeRatesManagement.tsx
import React, { useState } from 'react';
import {
  useExchangeRates,
  useCreateExchangeRate,
  useUpdateExchangeRate,
  useDeleteExchangeRate,
} from '@/hooks/queries/exchangeRate.queries';
import { useCurrencies } from '@/hooks/queries/currency.queries';
import { TExchangeRateSchema } from '@/lib/validators/exchangeRateValidator';
import { ExchangeRate } from '@/services/exchangeRate.service';
import { Currency } from '@/services/currency.service';

// Layouts & Components
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import PaginationControls from '@/components/admin/PaginationControls'; // Reusable pagination component
import ExchangeRatesTable from '@/components/admin/exchange-rates/ExchangeRatesTable';
import ExchangeRateDialog from '@/components/admin/exchange-rates/ExchangeRateDialog';
import DeleteExchangeRateDialog from '@/components/admin/exchange-rates/DeleteExchangeRateDialog';
import { Icons } from '@/components/common/Icons';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ExchangeRatesManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);

  // Fetching data
  const { data: ratesData, isLoading: isLoadingRates } = useExchangeRates({
    page,
    limit: itemsPerPage,
    fromCurrency: fromFilter || undefined,
    toCurrency: toFilter || undefined,
  });
  const { data: currenciesData, isLoading: isLoadingCurrencies } =
    useCurrencies({ limit: 100 });

  // Mutations
  const createMutation = useCreateExchangeRate({
    onSuccess: () => {
      toast.success('Exchange rate created successfully!');
      setIsDialogOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.body?.message || 'Failed to create exchange rate.'),
  });

  const updateMutation = useUpdateExchangeRate({
    onSuccess: () => {
      toast.success('Exchange rate updated successfully!');
      setIsDialogOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.body?.message || 'Failed to update exchange rate.'),
  });

  const deleteMutation = useDeleteExchangeRate({
    onSuccess: () => {
      toast.success('Exchange rate deleted successfully!');
      setIsDeleteDialogOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.body?.message || 'Failed to delete exchange rate.'),
  });

  const handleOpenAddDialog = () => {
    setSelectedRate(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (rate: ExchangeRate) => {
    setSelectedRate(rate);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (rate: ExchangeRate) => {
    setSelectedRate(rate);
    setIsDeleteDialogOpen(true);
  };

  const handleDialogSubmit = (data: TExchangeRateSchema) => {
    if (selectedRate) {
      // Editing
      updateMutation.mutate({ rateId: selectedRate.rateId, data });
    } else {
      // Creating
      createMutation.mutate({
        fromCurrencyId: data.fromCurrencyId!,
        toCurrencyId: data.toCurrencyId!,
        rate: data.rate!,
        effectiveTimestamp: data.effectiveTimestamp!,
        source: data.source!,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedRate) {
      deleteMutation.mutate(selectedRate.rateId);
    }
  };

  const isDataLoading = isLoadingRates || isLoadingCurrencies;
  const isMutationPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;
  const currencies: Currency[] = currenciesData?.currencies || [];
  return (
    <AdminLayout>
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Exchange Rates
            </h1>
            <p className='text-muted-foreground'>
              Manage currency conversion rates for payments.
            </p>
          </div>
          <Button
            onClick={handleOpenAddDialog}
            disabled={isLoadingCurrencies || currencies.length < 2}
          >
            <Icons.plus className='mr-2 h-4 w-4' /> Add Rate
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Exchange Rates</CardTitle>
            <div className='flex flex-col sm:flex-row gap-2 pt-2 items-center'>
              <CardDescription className='flex-grow'>
                Filter and manage conversion rates.
              </CardDescription>
              <div className='flex w-full sm:w-auto gap-2'>
                <Select
                  value={fromFilter}
                  onValueChange={(value) => {
                    setFromFilter(value === 'ALL' ? '' : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className='w-full sm:w-[150px]'>
                    <SelectValue placeholder='From...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>From (All)</SelectItem>
                    {currencies.map((c) => (
                      <SelectItem key={c.currencyId} value={c.currencyId}>
                        {c.currencyId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={toFilter}
                  onValueChange={(value) => {
                    setToFilter(value === 'ALL' ? '' : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className='w-full sm:w-[150px]'>
                    <SelectValue placeholder='To...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='ALL'>To (All)</SelectItem>
                    {currencies.map((c) => (
                      <SelectItem key={c.currencyId} value={c.currencyId}>
                        {c.currencyId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ExchangeRatesTable
              exchangeRates={ratesData?.exchangeRates}
              isLoading={isLoadingRates}
              onEdit={handleOpenEditDialog}
              onDelete={handleOpenDeleteDialog}
            />
          </CardContent>
        </Card>

        {ratesData && ratesData.totalPages > 1 && (
          <PaginationControls
            currentPage={page}
            totalPages={ratesData.totalPages}
            setCurrentPage={setPage}
          />
        )}
      </div>

      <ExchangeRateDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        exchangeRate={selectedRate}
        onSubmit={handleDialogSubmit}
        isEditing={!!selectedRate}
        isPending={isMutationPending}
        currencies={currencies}
      />

      <DeleteExchangeRateDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        exchangeRate={selectedRate}
        isPending={deleteMutation.isPending}
      />
    </AdminLayout>
  );
};

export default ExchangeRatesManagement;
