// src/pages/admin/PromotionsManagement.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import {
  usePromotions,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  useDeactivatePromotion, // <-- SỬ DỤNG HOOK ĐÚNG
  usePromotionDetail, // <-- SỬ DỤNG HOOK NÀY
} from '@/hooks/queries/promotion.queries';
import { Promotion } from '@/services/promotion.service';
import { TPromotionSchema } from '@/lib/validators/promotionValidator';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PaginationControls from '@/components/admin/PaginationControls';
import PromotionsTable from '@/components/admin/promotions/PromotionsTable';
import PromotionDialog from '@/components/admin/promotions/PromotionDialog';
import DeletePromotionDialog from '@/components/admin/promotions/DeletePromotionDialog';
import { Icons } from '@/components/common/Icons';
import { toast } from 'sonner';

type StatusTab = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

const PromotionsManagement: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promotionToInteract, setPromotionToInteract] =
    useState<Promotion | null>(null);

  // Lấy dữ liệu chi tiết khi một promotion được chọn để sửa
  const { data: selectedPromotionDetails, isLoading: isLoadingDetails } =
    usePromotionDetail(
      promotionToInteract?.promotionId,
      { enabled: !!promotionToInteract && isDialogOpen } // Chỉ fetch khi dialog mở và có promotion được chọn
    );

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      searchTerm: debouncedSearchTerm,
      status: activeTab === 'ALL' ? undefined : activeTab,
      sortBy: 'createdAt:desc',
    }),
    [page, debouncedSearchTerm, activeTab]
  );

  const { data, isLoading, isError, error } = usePromotions(queryParams);
  const { mutate: createPromotion, isPending: isCreating } =
    useCreatePromotion();
  const { mutate: updatePromotion, isPending: isUpdating } =
    useUpdatePromotion();
  const { mutate: deactivatePromotion, isPending: isDeactivating } =
    useDeactivatePromotion();
  const { mutate: deletePromotion, isPending: isDeleting } =
    useDeletePromotion();

  const handleTabChange = (value: string) => {
    setActiveTab(value as StatusTab);
    setPage(1);
  };

  const handleOpenAddDialog = () => {
    setPromotionToInteract(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (promotion: Promotion) => {
    setPromotionToInteract(promotion);
    setIsDialogOpen(true);
  };

  const handleOpenDeactivate = (promotion: Promotion) => {
    toast.warning(`Deactivate "${promotion.promotionName}"?`, {
      action: {
        label: 'Confirm',
        onClick: () =>
          deactivatePromotion(promotion.promotionId, {
            onSuccess: () =>
              toast.success(
                `"${promotion.promotionName}" has been deactivated.`
              ),
            onError: (err) =>
              toast.error(err.message || 'Failed to deactivate.'),
          }),
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    });
  };

  const handleOpenDeleteDialog = (promotion: Promotion) => {
    setPromotionToInteract(promotion);
    setIsDeleteDialogOpen(true);
  };

  const handleDialogSubmit = (
    formData: TPromotionSchema,
    promotionId?: number
  ) => {
    const payload = {
      ...formData,
      promotionName: formData.promotionName ?? '', // Ensure promotionName is always present
      maxUsageLimit:
        formData.maxUsageLimit === 0 ? null : formData.maxUsageLimit,
      minOrderValue:
        formData.minOrderValue === 0 ? null : formData.minOrderValue,
      maxDiscountAmount:
        formData.maxDiscountAmount === 0 ? null : formData.maxDiscountAmount,
      discountCode: formData.discountCode ?? '', // Ensure discountCode is always present
      discountType: formData.discountType ?? 'PERCENTAGE', // Ensure discountType is always present
      discountValue: formData.discountValue ?? 0, // Ensure discountValue is always present and not undefined
      startDate: formData.startDate ?? '', // Ensure startDate is always present
      endDate: formData.endDate ?? '', // Ensure endDate is always present
    };

    if (promotionId) {
      updatePromotion(
        { promotionId, data: payload },
        {
          onSuccess: () => {
            toast.success('Promotion updated successfully!');
            setIsDialogOpen(false);
          },
          onError: (err) =>
            toast.error(err.message || 'Failed to update promotion.'),
        }
      );
    } else {
      createPromotion(payload, {
        onSuccess: () => {
          toast.success('Promotion created successfully!');
          setIsDialogOpen(false);
        },
        onError: (err) =>
          toast.error(err.message || 'Failed to create promotion.'),
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (promotionToInteract?.promotionId) {
      deletePromotion(promotionToInteract.promotionId, {
        onSuccess: () => {
          toast.success('Promotion deleted successfully!');
          setIsDeleteDialogOpen(false);
        },
        onError: (err) =>
          toast.error(err.message || 'Failed to delete promotion.'),
      });
    }
  };

  useEffect(() => {
    if (isError) toast.error(error.message || 'An error occurred.');
  }, [isError, error]);

  const promotions = data?.promotions || [];
  const totalPages = data?.totalPages || 1;

  // Xác định dữ liệu để truyền vào dialog, ưu tiên dữ liệu chi tiết mới fetch
  const promotionForDialog = isDialogOpen
    ? selectedPromotionDetails || promotionToInteract
    : null;

  return (
    <AdminLayout>
      {/* ... code JSX của layout và header ... */}
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Promotions</h1>
            <p className='text-muted-foreground'>
              Create and manage promotional discounts.
            </p>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <Icons.plus className='mr-2 h-4 w-4' /> Create Promotion
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <TabsList>
              <TabsTrigger value='ALL'>All</TabsTrigger>
              <TabsTrigger value='ACTIVE'>Active</TabsTrigger>
              <TabsTrigger value='INACTIVE'>Inactive</TabsTrigger>
              <TabsTrigger value='EXPIRED'>Expired</TabsTrigger>
            </TabsList>
            <div className='relative w-full sm:max-w-xs'>
              <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search by name or code...'
                className='pl-10'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <Card className='mt-4'>
            <CardContent className='p-0'>
              {isLoading ? (
                <div className='p-6 text-center text-muted-foreground'>
                  Loading promotions...
                </div>
              ) : (
                <PromotionsTable
                  promotions={promotions}
                  onEdit={handleOpenEditDialog}
                  onDeactivate={handleOpenDeactivate}
                  onDelete={handleOpenDeleteDialog}
                />
              )}
            </CardContent>
          </Card>
        </Tabs>

        {totalPages > 1 && (
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            setCurrentPage={setPage}
          />
        )}
      </div>

      <PromotionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        // Truyền dữ liệu mới nhất vào dialog
        promotion={promotionForDialog}
        onSubmit={handleDialogSubmit}
        isPending={
          isCreating || isUpdating || (isDialogOpen && isLoadingDetails)
        }
      />

      <DeletePromotionDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        promotion={promotionToInteract}
        onConfirm={handleDeleteConfirm}
        isPending={isDeleting}
      />
    </AdminLayout>
  );
};

export default PromotionsManagement;
