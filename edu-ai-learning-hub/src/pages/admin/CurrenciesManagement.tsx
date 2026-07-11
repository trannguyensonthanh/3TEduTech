// src/pages/admin/CurrenciesManagement.tsx
import React, { useState } from 'react';
import {
  useCurrencies,
  useCreateCurrency,
  useUpdateCurrency,
  useDeleteCurrency,
} from '@/hooks/queries/currency.queries';
import { TCurrencySchema } from '@/lib/validators/currencyValidator';
import { Currency } from '@/services/currency.service';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import CurrenciesTable from '@/components/admin/currencies/CurrenciesTable';
import CurrencyDialog from '@/components/admin/currencies/CurrencyDialog';
import DeleteCurrencyDialog from '@/components/admin/currencies/DeleteCurrencyDialog';
import { Icons } from '@/components/common/Icons';
import { toast } from 'sonner';

const CurrenciesManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, isError, error } = useCurrencies({
    page,
    limit: itemsPerPage,
  });

  const createCurrencyMutation = useCreateCurrency({
    onSuccess: () => {
      toast.success('Currency created successfully!');
      setIsDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create currency.');
    },
  });

  const updateCurrencyMutation = useUpdateCurrency({
    onSuccess: () => {
      toast.success('Currency updated successfully!');
      setIsDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update currency.');
    },
  });

  const deleteCurrencyMutation = useDeleteCurrency({
    onSuccess: () => {
      toast.success('Currency deleted successfully!');
      setIsDeleteDialogOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete currency.');
    },
  });

  const handleOpenAddDialog = () => {
    setIsEditing(false);
    setSelectedCurrency(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (currency: Currency) => {
    setIsEditing(true);
    setSelectedCurrency(currency);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (currency: Currency) => {
    setSelectedCurrency(currency);
    setIsDeleteDialogOpen(true);
  };

  const handleDialogSubmit = (data: TCurrencySchema) => {
    if (isEditing && selectedCurrency) {
      // Chỉ gửi các trường đã thay đổi để tối ưu
      const changedData = Object.keys(data).reduce((acc, key) => {
        if (data[key] !== selectedCurrency[key]) {
          acc[key] = data[key];
        }
        return acc;
      }, {});
      if (Object.keys(changedData).length > 0) {
        updateCurrencyMutation.mutate({
          currencyId: selectedCurrency.currencyId,
          data: changedData,
        });
      } else {
        setIsDialogOpen(false); // Không có gì thay đổi, chỉ cần đóng dialog
      }
    } else {
      // Ensure currencyId is included for creation
      createCurrencyMutation.mutate({
        currencyId: data.currencyId,
        currencyName: data.currencyName,
        type: data.type,
        decimalPlaces: data.decimalPlaces,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedCurrency) {
      deleteCurrencyMutation.mutate(selectedCurrency.currencyId);
    }
  };

  if (isError) {
    toast.error(
      error.message || 'An error occurred while fetching currencies.'
    );
  }

  const totalPages = data?.totalPages || 1;

  return (
    <AdminLayout>
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Currencies Management
            </h1>
            <p className='text-muted-foreground'>
              Manage all supported currencies in the system.
            </p>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <Icons.plus className='mr-2 h-4 w-4' /> Add Currency
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Supported Currencies</CardTitle>
            <CardDescription>
              A list of all currencies available for course pricing and payouts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CurrenciesTable
              currencies={data?.currencies}
              isLoading={isLoading}
              onEdit={handleOpenEditDialog}
              onDelete={handleOpenDeleteDialog}
            />
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className='flex items-center justify-center'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <PaginationPrevious
                      href='#'
                      onClick={(e) => e.preventDefault()}
                    />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span className='px-4 py-2 text-sm font-medium'>
                    Page {page} of {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <PaginationNext
                      href='#'
                      onClick={(e) => e.preventDefault()}
                    />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <CurrencyDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currency={selectedCurrency}
        onSubmit={handleDialogSubmit}
        isEditing={isEditing}
        isPending={
          createCurrencyMutation.isPending || updateCurrencyMutation.isPending
        }
      />

      <DeleteCurrencyDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        currency={selectedCurrency}
        isPending={deleteCurrencyMutation.isPending}
      />
    </AdminLayout>
  );
};

export default CurrenciesManagement;
