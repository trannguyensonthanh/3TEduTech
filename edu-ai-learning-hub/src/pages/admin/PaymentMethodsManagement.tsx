// src/pages/admin/PaymentMethodsManagement.tsx
import React, { useState } from 'react';
import {
  usePaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
} from '@/hooks/queries/paymentMethod.queries';
import { TPaymentMethodSchema } from '@/lib/validators/paymentMethodValidator';
import { PaymentMethod } from '@/services/paymentMethod.service';

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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import PaymentMethodsTable from '@/components/admin/payment-methods/PaymentMethodsTable';
import PaymentMethodDialog from '@/components/admin/payment-methods/PaymentMethodDialog';
import DeletePaymentMethodDialog from '@/components/admin/payment-methods/DeletePaymentMethodDialog';
import { Icons } from '@/components/common/Icons';
import { toast } from 'sonner';

const PaymentMethodsManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );

  const { data, isLoading, isError, error } = usePaymentMethods({
    page,
    limit: itemsPerPage,
  });

  const createMutation = useCreatePaymentMethod({
    onSuccess: () => {
      toast.success('Payment method created successfully!');
      setIsDialogOpen(false);
    },
    onError: (err) =>
      toast.error(err.message || 'Failed to create payment method.'),
  });

  const updateMutation = useUpdatePaymentMethod({
    onSuccess: () => {
      toast.success('Payment method updated successfully!');
      setIsDialogOpen(false);
    },
    onError: (err) =>
      toast.error(err.message || 'Failed to update payment method.'),
  });

  const deleteMutation = useDeletePaymentMethod({
    onSuccess: () => {
      toast.success('Payment method deleted successfully!');
      setIsDeleteDialogOpen(false);
    },
    onError: (err) =>
      toast.error(err.message || 'Failed to delete payment method.'),
  });

  const handleOpenAddDialog = () => {
    setSelectedMethod(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setIsDeleteDialogOpen(true);
  };

  const handleDialogSubmit = (data: TPaymentMethodSchema) => {
    if (selectedMethod) {
      // Editing
      const changedData: Partial<TPaymentMethodSchema> = Object.keys(
        data
      ).reduce((acc, key) => {
        if (data[key] !== selectedMethod[key]) acc[key] = data[key];
        return acc;
      }, {});
      if (Object.keys(changedData).length > 0) {
        updateMutation.mutate({
          methodId: selectedMethod.methodId,
          data: changedData,
        });
      } else {
        setIsDialogOpen(false);
      }
    } else {
      // Creating
      createMutation.mutate({
        methodId: data.methodId!,
        methodName: data.methodName,
        description: data.description,
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedMethod) {
      deleteMutation.mutate(selectedMethod.methodId);
    }
  };

  if (isError) {
    toast.error(error.message || 'An error occurred while fetching data.');
  }

  const totalPages = data?.totalPages || 1;
  const isEditing = !!selectedMethod;

  return (
    <AdminLayout>
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Payment Methods
            </h1>
            <p className='text-muted-foreground'>
              Manage all supported payment methods in the system.
            </p>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <Icons.plus className='mr-2 h-4 w-4' /> Add Method
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Supported Methods</CardTitle>
            <CardDescription>
              A list of payment methods available for checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentMethodsTable
              paymentMethods={data?.paymentMethods}
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

      <PaymentMethodDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        paymentMethod={selectedMethod}
        onSubmit={handleDialogSubmit}
        isEditing={isEditing}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <DeletePaymentMethodDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        paymentMethod={selectedMethod}
        isPending={deleteMutation.isPending}
      />
    </AdminLayout>
  );
};

export default PaymentMethodsManagement;
