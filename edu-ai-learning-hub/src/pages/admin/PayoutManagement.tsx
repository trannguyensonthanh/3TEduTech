// src/pages/admin/PayoutManagement.tsx
import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useAdminGetWithdrawalRequests,
  useAdminGetPayouts,
} from '@/hooks/queries/financials.queries';
import WithdrawalRequestsTable from '@/components/admin/payouts/WithdrawalRequestsTable';
import { ReviewWithdrawalDialog } from '@/components/admin/payouts/ReviewWithdrawalDialog';
import { WithdrawalRequest, Payout } from '@/services/financials.service';
import PayoutsTable from '@/components/admin/payouts/PayoutsTable';
import { ProcessPayoutDialog } from '@/components/admin/payouts/ProcessPayoutDialog';
import PaginationControls from '@/components/admin/PaginationControls';

const PayoutManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('requests');

  // States for Withdrawal Requests Tab
  const [requestPage, setRequestPage] = useState(1);
  const [requestStatusFilter, setRequestStatusFilter] = useState('PENDING');
  const [selectedRequest, setSelectedRequest] =
    useState<WithdrawalRequest | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // States for Payouts Tab
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('PENDING');
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);

  // Fetching Data
  const { data: requestsData, isLoading: isLoadingRequests } =
    useAdminGetWithdrawalRequests({
      page: requestPage,
      limit: 10,
      status: requestStatusFilter === 'ALL' ? undefined : requestStatusFilter,
    });

  const { data: payoutsData, isLoading: isLoadingPayouts } = useAdminGetPayouts(
    {
      page: payoutPage,
      limit: 10,
      statusId: payoutStatusFilter === 'ALL' ? undefined : payoutStatusFilter,
    }
  );

  // Handlers
  const handleReviewRequest = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setIsReviewDialogOpen(true);
  };

  const handleProcessPayout = (payout: Payout) => {
    setSelectedPayout(payout);
    setIsProcessDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className='space-y-6'>
        <h1 className='text-3xl font-bold'>Payouts & Withdrawals</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='requests'>Withdrawal Requests</TabsTrigger>
            <TabsTrigger value='payouts'>Payouts Queue</TabsTrigger>
          </TabsList>

          {/* WITHDRAWAL REQUESTS TAB */}
          <TabsContent value='requests' className='mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>Review Requests</CardTitle>
                <CardDescription>
                  Approve or reject withdrawal requests from instructors.
                </CardDescription>
                <Tabs
                  value={requestStatusFilter}
                  onValueChange={(val) => {
                    setRequestStatusFilter(val);
                    setRequestPage(1);
                  }}
                  className='pt-2'
                >
                  <TabsList>
                    <TabsTrigger value='PENDING'>Pending</TabsTrigger>
                    <TabsTrigger value='APPROVED'>Approved</TabsTrigger>
                    <TabsTrigger value='REJECTED'>Rejected</TabsTrigger>
                    <TabsTrigger value='ALL'>All</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {isLoadingRequests ? (
                  <p>Loading...</p>
                ) : (
                  <WithdrawalRequestsTable
                    requests={requestsData?.requests || []}
                    onReview={handleReviewRequest}
                  />
                )}
              </CardContent>
            </Card>
            {requestsData && requestsData.totalPages > 1 && (
              <PaginationControls
                currentPage={requestPage}
                totalPages={requestsData.totalPages}
                setCurrentPage={setRequestPage}
                className='mt-4'
              />
            )}
          </TabsContent>

          {/* PAYOUTS TAB */}
          <TabsContent value='payouts' className='mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>Process Payouts</CardTitle>
                <CardDescription>
                  Manage and update the status of approved payout transactions.
                </CardDescription>
                <Tabs
                  value={payoutStatusFilter}
                  onValueChange={(val) => {
                    setPayoutStatusFilter(val);
                    setPayoutPage(1);
                  }}
                  className='pt-2'
                >
                  <TabsList>
                    <TabsTrigger value='PENDING'>Pending</TabsTrigger>
                    <TabsTrigger value='PROCESSING'>Processing</TabsTrigger>
                    <TabsTrigger value='PAID'>Paid</TabsTrigger>
                    <TabsTrigger value='FAILED'>Failed</TabsTrigger>
                    <TabsTrigger value='ALL'>All</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {isLoadingPayouts ? (
                  <p>Loading...</p>
                ) : (
                  <PayoutsTable
                    payouts={
                      payoutsData?.payouts?.filter(
                        (p): p is Payout =>
                          !!p && (p as Payout).payoutId !== undefined
                      ) || []
                    }
                    onProcess={handleProcessPayout}
                  />
                )}
              </CardContent>
            </Card>
            {payoutsData && payoutsData.totalPages > 1 && (
              <PaginationControls
                currentPage={payoutPage}
                totalPages={payoutsData.totalPages}
                setCurrentPage={setPayoutPage}
                className='mt-4'
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ReviewWithdrawalDialog
        isOpen={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        request={selectedRequest}
      />
      <ProcessPayoutDialog
        isOpen={isProcessDialogOpen}
        onOpenChange={setIsProcessDialogOpen}
        payout={selectedPayout}
      />
    </AdminLayout>
  );
};

export default PayoutManagement;
