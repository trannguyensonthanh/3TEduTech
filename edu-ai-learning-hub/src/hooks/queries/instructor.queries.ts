/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/queries/instructor.queries.ts
import {
  useQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  getMyInstructorProfile,
  updateMyInstructorProfile,
  updateMyBankInfo,
  addMySkill,
  removeMySkill,
  addOrUpdateMySocialLink,
  removeMySocialLink,
  // getMyDashboardData,
  getInstructorPublicProfile,
  InstructorProfile,
  UpdateInstructorProfileData,
  BankInfo,
  UpdateBankInfoData,
  InstructorSkill,
  SocialLink,
  DashboardData,
  InstructorListResponse,
  InstructorQueryParams,
  getInstructors,
  InstructorStudentQueryParams,
  InstructorStudentListResponse,
  getMyStudentsApi,
  InstructorFinancialOverviewResponse,
  getMyFinancialOverview,
  updateMyPayoutMethodDetails,
  UpdatePayoutMethodDetailsData,
  InstructorPayoutMethodItem,
  getMyPayoutMethods,
  addMyPayoutMethod,
  CreateInstructorPayoutMethodData,
  setMyPrimaryPayoutMethod,
  deleteMyPayoutMethod,
  InstructorDashboardData,
  getMyDashboardOverview,
} from '@/services/instructor.service';

// Query Key Factory
const instructorKeys = {
  all: ['instructors'] as const,
  myProfile: () => [...instructorKeys.all, 'me', 'profile'] as const,
  // myDashboard: () => [...instructorKeys.all, 'me', 'dashboard'] as const,
  myFinancialOverview: () =>
    [...instructorKeys.all, 'me', 'financialOverview'] as const,
  publicProfiles: () => [...instructorKeys.all, 'publicProfile'] as const,
  publicProfile: (id: number | undefined) =>
    [...instructorKeys.publicProfiles(), id] as const,
  details: () => [...instructorKeys.all, 'detail'] as const,
  detailById: (id: number | undefined) =>
    [...instructorKeys.details(), 'id', id] as const,
  detailBySlug: (slug: string | undefined) =>
    [...instructorKeys.details(), 'slug', slug] as const,
  lists: (params?: InstructorQueryParams) =>
    [...instructorKeys.all, 'list', params || {}] as const,
  myStudentsLists: () =>
    [...instructorKeys.all, 'me', 'students', 'list'] as const,
  myStudentsList: (params?: InstructorStudentQueryParams) =>
    [...instructorKeys.myStudentsLists(), params || {}] as const,
  myPayoutMethods: () =>
    [...instructorKeys.all, 'me', 'payoutMethods'] as const,
  myDashboardOverview: () =>
    [...instructorKeys.all, 'me', 'dashboardOverview'] as const,
};

// --- Queries ---

/**
 * Hook để lấy danh sách giảng viên (public) với các tùy chọn filter và phân trang.
 */
export const useInstructors = (
  params?: InstructorQueryParams,
  options?: Omit<
    UseQueryOptions<
      InstructorListResponse,
      Error,
      InstructorListResponse,
      unknown[]
    >,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<InstructorListResponse, Error> => {
  const queryKey = instructorKeys.lists(params);
  return useQuery<
    InstructorListResponse,
    Error,
    InstructorListResponse,
    unknown[]
  >({
    queryKey: queryKey as any,
    queryFn: () => getInstructors(params),
    staleTime: 1000 * 60 * 5, // Cache danh sách giảng viên trong 5 phút
    // keepPreviousData: true, // Cân nhắc sử dụng nếu muốn giữ dữ liệu cũ khi params thay đổi (hữu ích cho UX phân trang)
    ...options,
  });
};

/** Hook Instructor lấy profile đầy đủ của mình */
export const useMyInstructorProfile = (
  options?: Omit<
    UseQueryOptions<InstructorProfile, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<InstructorProfile, Error>({
    queryKey: instructorKeys.myProfile(),
    queryFn: getMyInstructorProfile,
    staleTime: 1000 * 60 * 5, // Cache 5 phút
    ...options,
  });
};

/** Hook lấy profile công khai của instructor */
export const useInstructorPublicProfile = (
  instructorId: number | undefined,
  options?: Omit<
    UseQueryOptions<Partial<InstructorProfile>, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = instructorKeys.publicProfile(instructorId);
  return useQuery<Partial<InstructorProfile>, Error>({
    queryKey: queryKey,
    queryFn: () => getInstructorPublicProfile(instructorId!),
    enabled: !!instructorId,
    ...options,
  });
};

// --- Mutations ---

/** Hook Instructor cập nhật profile chuyên nghiệp */
export const useUpdateMyInstructorProfile = (
  options?: UseMutationOptions<
    InstructorProfile,
    Error,
    UpdateInstructorProfileData
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<InstructorProfile, Error, UpdateInstructorProfileData>({
    mutationFn: updateMyInstructorProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(instructorKeys.myProfile(), data);
      console.log('Instructor profile updated.');
      // toast.success('Cập nhật hồ sơ giảng viên thành công!');
    },
    onError: (error) => {
      console.error('Instructor profile update failed:', error.message);
      // toast.error(error.message || 'Cập nhật hồ sơ thất bại.');
    },
    ...options,
  });
};

/** Hook Instructor cập nhật thông tin ngân hàng */
export const useUpdateMyBankInfo = (
  options?: UseMutationOptions<BankInfo, Error, UpdateBankInfoData>
) => {
  const queryClient = useQueryClient();
  return useMutation<BankInfo, Error, UpdateBankInfoData>({
    mutationFn: updateMyBankInfo,
    onSuccess: () => {
      // Invalidate my profile để load lại thông tin mới (nếu profile có chứa bank info)
      queryClient.invalidateQueries({ queryKey: instructorKeys.myProfile() });
      console.log('Bank info updated.');
      // toast.success('Cập nhật thông tin ngân hàng thành công!');
    },
    onError: (error) => {
      console.error('Bank info update failed:', error.message);
      // toast.error(error.message || 'Cập nhật thông tin ngân hàng thất bại.');
    },
    ...options,
  });
};

/** Hook Instructor thêm kỹ năng */
export const useAddMySkill = (
  options?: UseMutationOptions<{ skills: InstructorSkill[] }, Error, number>
) => {
  const queryClient = useQueryClient();
  return useMutation<{ skills: InstructorSkill[] }, Error, number>({
    // Input là skillId
    mutationFn: addMySkill,
    onSuccess: (data) => {
      // Cập nhật cache profile với list skills mới
      queryClient.setQueryData(
        instructorKeys.myProfile(),
        (oldData: InstructorProfile | undefined) =>
          oldData ? { ...oldData, skills: data.skills } : undefined
      );
      console.log('Skill added.');
      // toast.success('Thêm kỹ năng thành công!');
    },
    onError: (error) => {
      console.error('Add skill failed:', error.message);
      // toast.error(error.message || 'Thêm kỹ năng thất bại.');
    },
    ...options,
  });
};

/** Hook Instructor xóa kỹ năng */
export const useRemoveMySkill = (
  options?: UseMutationOptions<{ skills: InstructorSkill[] }, Error, number>
) => {
  const queryClient = useQueryClient();
  return useMutation<{ skills: InstructorSkill[] }, Error, number>({
    // Input là skillId
    mutationFn: removeMySkill,
    onSuccess: (data, skillId) => {
      queryClient.setQueryData(
        instructorKeys.myProfile(),
        (oldData: InstructorProfile | undefined) =>
          oldData ? { ...oldData, skills: data.skills } : undefined
      );
      console.log(`Skill ${skillId} removed.`);
      // toast.success('Xóa kỹ năng thành công!');
    },
    onError: (error) => {
      console.error('Remove skill failed:', error.message);
      // toast.error(error.message || 'Xóa kỹ năng thất bại.');
    },
    ...options,
  });
};

/** Hook Instructor thêm/cập nhật social link */
export const useAddOrUpdateMySocialLink = (
  options?: UseMutationOptions<
    { socialLinks: SocialLink[] },
    Error,
    { platform: string; url: string }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    { socialLinks: SocialLink[] },
    Error,
    { platform: string; url: string }
  >({
    mutationFn: ({ platform, url }) => addOrUpdateMySocialLink(platform, url),
    onSuccess: (data) => {
      queryClient.setQueryData(
        instructorKeys.myProfile(),
        (oldData: InstructorProfile | undefined) =>
          oldData ? { ...oldData, socialLinks: data.socialLinks } : undefined
      );
      console.log('Social link added/updated.');
      // toast.success('Cập nhật liên kết thành công!');
    },
    onError: (error) => {
      console.error('Add/Update social link failed:', error.message);
      // toast.error(error.message || 'Cập nhật liên kết thất bại.');
    },
    ...options,
  });
};

/** Hook Instructor xóa social link */
export const useRemoveMySocialLink = (
  options?: UseMutationOptions<{ socialLinks: SocialLink[] }, Error, string>
) => {
  const queryClient = useQueryClient();
  return useMutation<{ socialLinks: SocialLink[] }, Error, string>({
    // Input là platform
    mutationFn: removeMySocialLink,
    onSuccess: (data, platform) => {
      queryClient.setQueryData(
        instructorKeys.myProfile(),
        (oldData: InstructorProfile | undefined) =>
          oldData ? { ...oldData, socialLinks: data.socialLinks } : undefined
      );
      console.log(`Social link ${platform} removed.`);
      // toast.success('Xóa liên kết thành công!');
    },
    onError: (error) => {
      console.error('Remove social link failed:', error.message);
      // toast.error(error.message || 'Xóa liên kết thất bại.');
    },
    ...options,
  });
};

/** Instructor: Hook lấy danh sách học viên của mình */
export const useMyStudents = (
  params: InstructorStudentQueryParams,
  options?: Omit<
    UseQueryOptions<
      InstructorStudentListResponse,
      Error,
      InstructorStudentListResponse,
      ReturnType<typeof instructorKeys.myStudentsList>
    >,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    // Bỏ generic types ở đây nếu queryKey đã có kiểu
    queryKey: instructorKeys.myStudentsList(params),
    queryFn: () => getMyStudentsApi(params),
    placeholderData: (prevData) => prevData,
    ...options,
  });
};

/** Hook Instructor lấy dữ liệu tổng quan tài chính */
export const useMyFinancialOverview = (
  options?: Omit<
    UseQueryOptions<InstructorFinancialOverviewResponse, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryKey = instructorKeys.myFinancialOverview();
  return useQuery<InstructorFinancialOverviewResponse, Error>({
    queryKey: queryKey,
    queryFn: getMyFinancialOverview,
    staleTime: 1000 * 60 * 5, // Cache 5 phút cho dữ liệu tổng quan
    ...options,
  });
};

/** Hook Instructor: Lấy danh sách phương thức thanh toán đã lưu */
export const useMyPayoutMethods = (
  options?: Omit<
    UseQueryOptions<InstructorPayoutMethodItem[], Error>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<InstructorPayoutMethodItem[], Error>({
    queryKey: instructorKeys.myPayoutMethods(),
    queryFn: getMyPayoutMethods,
    staleTime: 1000 * 60 * 5, // Cache 5 phút
    ...options,
  });
};

/** Hook Instructor cập nhật chi tiết phương thức thanh toán */
export const useUpdateMyPayoutMethodDetails = (
  options?: UseMutationOptions<
    { payoutMethods: InstructorPayoutMethodItem[] },
    Error,
    { payoutMethodId: number; details: UpdatePayoutMethodDetailsData }
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    { payoutMethods: InstructorPayoutMethodItem[] },
    Error,
    { payoutMethodId: number; details: UpdatePayoutMethodDetailsData }
  >({
    mutationFn: ({ payoutMethodId, details }) =>
      updateMyPayoutMethodDetails(payoutMethodId, details),
    onSuccess: (data) => {
      // Cập nhật cache danh sách payout methods
      queryClient.setQueryData(instructorKeys.myPayoutMethods(), data); // Giả sử API trả về danh sách mới
      // Hoặc invalidate: queryClient.invalidateQueries({ queryKey: instructorKeys.myPayoutMethods() });
      console.log('Payout method details updated.');
      // toast.success('Cập nhật chi tiết phương thức thanh toán thành công!');
    },
    onError: (error) => {
      console.error('Update payout method details failed:', error.message);
      // toast.error(error.message || 'Cập nhật chi tiết thất bại.');
    },
    ...options,
  });
};

/** Hook Instructor: Thêm phương thức thanh toán mới */
export const useAddMyPayoutMethod = (
  options?: UseMutationOptions<
    InstructorPayoutMethodItem,
    Error,
    CreateInstructorPayoutMethodData
  >
) => {
  const queryClient = useQueryClient();
  return useMutation<
    InstructorPayoutMethodItem,
    Error,
    CreateInstructorPayoutMethodData
  >({
    mutationFn: addMyPayoutMethod,
    onSuccess: (newItem) => {
      queryClient.setQueryData(
        instructorKeys.myPayoutMethods(),
        (oldData: InstructorPayoutMethodItem[] | undefined) =>
          oldData ? [...oldData, newItem] : [newItem]
      );
      // Hoặc invalidate để fetch lại toàn bộ list:
      // queryClient.invalidateQueries({ queryKey: instructorKeys.myPayoutMethods() });
      console.log('New payout method added.');
      // toast.success('Thêm phương thức thanh toán thành công!');
    },
    onError: (error) => {
      console.error('Add payout method failed:', error.message);
      // toast.error(error.message || 'Thêm phương thức thanh toán thất bại.');
    },
    ...options,
  });
};

/** Hook Instructor: Đặt một phương thức thanh toán làm mặc định */
export const useSetMyPrimaryPayoutMethod = (
  options?: UseMutationOptions<InstructorPayoutMethodItem, Error, number>
) => {
  const queryClient = useQueryClient();
  return useMutation<InstructorPayoutMethodItem, Error, number>({
    mutationFn: setMyPrimaryPayoutMethod, // payoutMethodId là input
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(
        instructorKeys.myPayoutMethods(),
        (oldData: InstructorPayoutMethodItem[] | undefined) =>
          oldData?.map(
            (item) =>
              item.payoutMethodId === updatedItem.payoutMethodId
                ? updatedItem // Thay thế item đã cập nhật
                : { ...item, isPrimary: false } // Đảm bảo các item khác không còn là primary
          ) || []
      );
      // Hoặc invalidate để fetch lại toàn bộ list:
      // queryClient.invalidateQueries({ queryKey: instructorKeys.myPayoutMethods() });
      console.log(
        `Payout method ${updatedItem.payoutMethodId} set as primary.`
      );
      // toast.success('Đặt làm phương thức thanh toán chính thành công!');
    },
    onError: (error) => {
      console.error('Set primary payout method failed:', error.message);
      // toast.error(error.message || 'Đặt làm phương thức chính thất bại.');
    },
    ...options,
  });
};

/** Hook Instructor: Xóa một phương thức thanh toán */
export const useDeleteMyPayoutMethod = (
  options?: UseMutationOptions<void, Error, number>
) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: deleteMyPayoutMethod, // payoutMethodId là input
    onSuccess: (_, payoutMethodId) => {
      queryClient.setQueryData(
        instructorKeys.myPayoutMethods(),
        (oldData: InstructorPayoutMethodItem[] | undefined) =>
          oldData?.filter((item) => item.payoutMethodId !== payoutMethodId) ||
          []
      );
      // Hoặc invalidate để fetch lại toàn bộ list:
      // queryClient.invalidateQueries({ queryKey: instructorKeys.myPayoutMethods() });
      console.log(`Payout method ${payoutMethodId} deleted.`);
      // toast.success('Xóa phương thức thanh toán thành công!');
    },
    onError: (error) => {
      console.error('Delete payout method failed:', error.message);
      // toast.error(error.message || 'Xóa phương thức thanh toán thất bại.');
    },
    ...options,
  });
};

/** Hook Instructor lấy dữ liệu tổng hợp cho Dashboard */
export const useMyDashboardOverview = (
  options?: Omit<
    UseQueryOptions<InstructorDashboardData, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery<InstructorDashboardData, Error>({
    queryKey: instructorKeys.myDashboardOverview(),
    queryFn: getMyDashboardOverview,
    staleTime: 1000 * 60 * 5, // Dữ liệu dashboard có thể cache 5 phút
    ...options,
  });
};
