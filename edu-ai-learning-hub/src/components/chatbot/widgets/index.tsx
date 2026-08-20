// src/components/chatbot/widgets/index.tsx
//
/* [VIẾT LẠI GIAO DIỆN 20/08/2026 — theo src/DESIGN-SYSTEM.md]
   Các thẻ widget trước đây mỗi cái một hệ màu riêng (xanh dương chuyển tím cho
   thẻ khóa học, ngọc chuyển lam cho thẻ thanh toán, lục cho thẻ thành công) và
   đều tự tô nền chuyển sắc. Nằm trong khung chat thì thành ba sản phẩm khác
   nhau chồng lên nhau. Nay tất cả dùng token bề mặt: viền `border-border`, nền
   `bg-card`, hành động chính `bg-primary`.

   Hành vi giữ nguyên tuyệt đối: cùng bộ hook thanh toán, cùng thứ tự gọi, cùng
   các nhánh điều hướng. */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  FileText,
  Loader2,
  Lock,
  Star,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import apiHelper from '@/services/apiHelper';
import { useMyEnrollments } from '@/hooks/queries/enrollment.queries';
import { useToast } from '@/hooks/use-toast';
import { useCourses } from '@/hooks/queries/course.queries';
import { useAddCourseToCart, useMyCart } from '@/hooks/queries/cart.queries';
import { useCreateOrderFromCart } from '@/hooks/queries/order.queries';
import {
  useCreateVnpayUrl,
  useCreateStripeSession,
  useCreateCryptoInvoice,
} from '@/hooks/queries/payment.queries';
import { useCreateMomoUrl } from '@/services/payment.service';

// --- THẺ ĐỀ XUẤT KHÓA HỌC ---
interface CourseCarouselWidgetProps {
  data: {
    courses: {
      courseId?: number;
      courseName: string;
      description: string;
      rrf_score?: number;
      price?: number;
      slug?: string;
      isEnrolled?: boolean;
    }[];
  };
  onSelectCourse?: (message: string) => void;
}

export const CourseCarouselWidget: React.FC<CourseCarouselWidgetProps> = ({ data, onSelectCourse }) => {
  const navigate = useNavigate();
  const rawCourses = data?.courses || [];

  // Deduplicate courses by courseId and courseName to eliminate duplicate course suggestions
  const courses = rawCourses.filter((course, index, self) =>
    index === self.findIndex((t) =>
      (t.courseId !== undefined && t.courseId === course.courseId) ||
      (t.courseName && course.courseName && t.courseName.trim().toLowerCase() === course.courseName.trim().toLowerCase())
    )
  );

  // Fetch student's purchased/enrolled courses to prevent prompting to buy already owned courses
  const { data: enrollmentData } = useMyEnrollments({}, { placeholderData: (prev) => prev });
  const enrolledList = enrollmentData?.enrollments || [];
  const enrolledIds = new Set(enrolledList.map((e: any) => e.courseId));
  const enrolledSlugs = new Set(enrolledList.map((e: any) => e.slug?.toLowerCase()));
  const enrolledNames = new Set(enrolledList.map((e: any) => e.courseName?.toLowerCase()));

  if (courses.length === 0) return null;

  // Hiển thị song song VNĐ / USD (tỷ giá tạm tính ~24.500)
  const formatDualPrice = (price?: number) => {
    if (!price || price <= 0) return 'Học liệu đề xuất';
    const priceVND = price.toLocaleString('vi-VN') + ' VNĐ';
    const priceUSD = '(' + (price / 24500).toFixed(2) + ' USD)';
    return `${priceVND} ~ ${priceUSD}`;
  };

  return (
    <div className="mt-3 w-full min-w-0 max-w-full space-y-3 overflow-hidden">
      {courses.map((course, idx) => {
        const isEnrolled = course.isEnrolled ||
          (course.courseId && enrolledIds.has(course.courseId)) ||
          (course.slug && enrolledSlugs.has(course.slug.toLowerCase())) ||
          (course.courseName && enrolledNames.has(course.courseName.toLowerCase()));

        return (
          <div
            key={idx}
            className="flex w-full min-w-0 flex-col gap-2.5 overflow-hidden rounded-xl border border-border bg-card p-4 text-card-foreground"
          >
            {/* Tiêu đề và số thứ tự */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 min-w-[26px] shrink-0 items-center justify-center rounded-md bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">
                  {idx + 1}
                </span>
                <h4 className="line-clamp-2 text-sm font-semibold leading-snug">
                  {course.courseName}
                </h4>
              </div>
              {isEnrolled ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
                  <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Đã đăng ký</span>
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  <Star className="h-3 w-3" aria-hidden="true" />
                  <span>Phù hợp</span>
                </span>
              )}
            </div>

            {/* Giá */}
            <div className="w-fit rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
              {formatDualPrice(course.price)}
            </div>

            {/* Mô tả */}
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {course.description || 'Khóa học được trợ lý chọn lọc theo mục tiêu học tập của bạn.'}
            </p>

            {/* Hành động */}
            <div className="mt-1 flex items-center justify-end gap-2 border-t border-border pt-3">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => {
                  if (course.slug) {
                    navigate(`/courses/${course.slug}`);
                  } else if (course.courseId) {
                    navigate(`/courses/${course.courseId}`);
                  } else {
                    navigate(`/courses?search=${encodeURIComponent(course.courseName)}`);
                  }
                }}
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Xem chi tiết
              </Button>

              {isEnrolled ? (
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    if (course.slug) {
                      navigate(`/courses/${course.slug}`);
                    } else if (course.courseId) {
                      navigate(`/courses/${course.courseId}`);
                    } else {
                      navigate('/my-courses');
                    }
                  }}
                >
                  <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Vào học ngay</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    if (onSelectCourse) {
                      onSelectCourse(`Tôi muốn mua khóa học số ${idx + 1}: ${course.courseName}`);
                    } else {
                      navigate(`/courses?search=${encodeURIComponent(course.courseName)}`);
                    }
                  }}
                >
                  Mua khóa {idx + 1}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};


// --- INSTANT AI CHECKOUT HOOK (DIRECT GATEWAY & REAL PRICE SYNC) ---
const useInstantAiCheckout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: coursesResponse } = useCourses({ limit: 100 }, { staleTime: 1000 * 60 * 5 });
  const { data: cartData } = useMyCart();
  const { mutateAsync: addCourseToCart } = useAddCourseToCart();
  const { mutateAsync: createOrder } = useCreateOrderFromCart();
  const { mutateAsync: createVnpayUrl } = useCreateVnpayUrl();
  const { mutateAsync: createMomoUrl } = useCreateMomoUrl();
  const { mutateAsync: createStripeUrl } = useCreateStripeSession();
  const { mutateAsync: createCryptoInvoice } = useCreateCryptoInvoice();
  const [isProcessing, setIsProcessing] = useState(false);

  const executeCheckout = async (courseNameOrId: string | number | undefined, paymentMethod: string) => {
    try {
      setIsProcessing(true);
      const method = (paymentMethod || 'VNPAY').toUpperCase();
      
      /* ====================================================================
         [SỬA 20/08/2026] HAI LỖI NGHIÊM TRỌNG VỀ TIỀN ĐÃ ĐƯỢC BỊT Ở ĐÂY

         LỖI 1 — TỰ CHỌN ĐẠI MỘT KHÓA HỌC KHI KHÔNG KHỚP
         Bản cũ kết thúc phép tìm bằng `|| courses[0]`, kèm chú thích "fallback
         nếu không khớp tuyệt đối, đảm bảo không bao giờ bị 0đ". Nhưng khi
         không khớp thì `courses[0]` là KHÓA HỌC ĐẦU TIÊN TRONG DANH MỤC, chẳng
         liên quan gì tới thứ người dùng đang xem. Nó được thêm vào giỏ, tạo
         đơn, rồi chuyển thẳng sang cổng thanh toán — không một bước xác nhận
         nào ở giữa. Người dùng trả tiền cho một khóa họ chưa từng chọn.

         Đường đi tới trạng thái đó có thật và không hiếm: `_resolve_course_
         reference` phía AI Service ánh xạ "khóa số 1" bằng cách bốc chuỗi in
         đậm thứ N trong câu trả lời trước, mà thứ tự chữ in đậm do mô hình tự
         viết ra, không liên quan tới thứ tự thẻ trong danh sách. Chỉ cần mô
         hình in đậm một cụm bất kỳ là tên khóa học "đã chọn" sai ngay.

         Nay: không khớp thì KHÔNG tạo đơn. Báo cho người dùng và đưa họ về
         trang danh sách khóa học kèm từ khóa để tự chọn.

         LỖI 2 — THANH TOÁN CẢ GIỎ HÀNG CHỨ KHÔNG PHẢI KHÓA ĐANG CHỌN
         `createOrder(null)` tạo đơn từ TOÀN BỘ giỏ hàng. Nếu người dùng đã bỏ
         sẵn ba khóa khác vào giỏ từ hôm trước, bấm "Đặt hàng và thanh toán"
         trong khung chat sẽ tính tiền cả bốn khóa, trong khi giao diện chỉ nói
         về đúng một khóa. Nay khi giỏ có nhiều hơn khóa đang chọn, hệ thống
         chuyển sang trang thanh toán chuẩn để người dùng nhìn thấy đầy đủ
         những gì mình sắp trả tiền.
         ==================================================================== */
      const courses = coursesResponse?.courses || [];
      const target = courses.find((c: any) => {
        if (!c) return false;
        if (typeof courseNameOrId === 'number' && c.courseId === courseNameOrId) return true;
        if (typeof courseNameOrId === 'string' && courseNameOrId) {
          const cleanInput = courseNameOrId.toLowerCase().replace(/khóa học[:\s]*/i, '').trim();
          const cleanCourseName = (c.courseName || '').toLowerCase().trim();
          if (!cleanInput || !cleanCourseName) return false;
          return cleanCourseName === cleanInput || cleanCourseName.includes(cleanInput) || cleanInput.includes(cleanCourseName);
        }
        return false;
      });

      if (!target || !target.courseId) {
        toast({
          title: 'Chưa xác định được khóa học',
          description:
            'Trợ lý không tìm ra khóa học khớp với lựa chọn của bạn trong danh mục. Để tránh đặt nhầm, bạn hãy chọn trực tiếp trong danh sách nhé.',
          variant: 'destructive',
        });
        const keyword =
          typeof courseNameOrId === 'string' && courseNameOrId
            ? `?q=${encodeURIComponent(courseNameOrId)}`
            : '';
        navigate(`/courses${keyword}`);
        setIsProcessing(false);
        return;
      }

      toast({
        title: '⚡ Đang chuẩn bị cổng thanh toán...',
        description: `Đang đồng bộ khóa học "${target.courseName}"...`,
      });

      // Kiểm tra xem khóa học đã có trong giỏ hàng chưa
      const cartItems = cartData?.items || [];
      const alreadyInCart = cartItems.some((i: any) => i.courseId === target.courseId);
      if (!alreadyInCart) {
        try {
          await addCourseToCart(target.courseId);
        } catch (err: any) {
          console.log('Notice when adding to cart from AI:', err?.message);
        }
      }

      /* Giỏ hàng đang chứa thứ khác ngoài khóa học này => KHÔNG tự tạo đơn.
         Đưa người dùng sang trang thanh toán chuẩn, nơi họ nhìn thấy đầy đủ
         danh sách và tổng tiền trước khi trả. */
      const hasOtherItems = cartItems.some(
        (i: any) => i.courseId !== target.courseId
      );
      if (hasOtherItems) {
        toast({
          title: 'Giỏ hàng đang có nhiều khóa học',
          description:
            'Bạn hãy xác nhận danh sách và tổng tiền ở trang thanh toán trước khi trả nhé.',
        });
        navigate('/checkout', {
          state: {
            preferredMethod: method,
            courseName: target.courseName,
            courseId: target.courseId,
          },
        });
        setIsProcessing(false);
        return;
      }

      // 2. Nếu là PayPal, điều hướng sang /checkout (lúc này giỏ hàng ĐÃ CÓ GIÁ TIỀN THẬT, không còn 0đ!)
      if (method === 'PAYPAL') {
        navigate('/checkout', { state: { preferredMethod: method, courseName: target.courseName, courseId: target.courseId } });
        setIsProcessing(false);
        return;
      }

      // 3. Với VNPAY, MOMO, STRIPE, CRYPTO -> Tự động tạo Đơn hàng và sang WEB HOOK / GATEWAY ngay lập tức không cần qua trang Checkout!
      /* [SỬA 19/08/2026] mutationFn ở đây là createOrderFromCart(promotionCode?:
         string | null) — nó nhận THẲNG mã khuyến mãi, không phải một object bọc
         ngoài. Truyền object khiến backend luôn nhận promotionCode = undefined
         (tức mất mã giảm giá nếu sau này có truyền), và TypeScript báo TS2345. */
      const order = await createOrder(null);
      if (!order || !order.orderId) {
        throw new Error('Không thể tạo đơn hàng tự động từ giỏ hàng AI.');
      }

      toast({
        title: '🚀 Đang mở Webhook Gateway...',
        description: `Đang chuyển hướng thẳng vào cổng thanh toán bảo mật ${method}...`,
      });

      if (method === 'MOCK_TEST') {
        setIsProcessing(false);
        return order.orderId;
      } else if (method === 'VNPAY') {
        await createVnpayUrl({ orderId: order.orderId });
      } else if (method === 'MOMO') {
        await createMomoUrl({ orderId: order.orderId });
      } else if (method === 'STRIPE') {
        await createStripeUrl({ orderId: order.orderId });
      } else if (method === 'CRYPTO') {
        const invoiceInfo = await createCryptoInvoice({
          orderId: order.orderId,
          cryptoCurrency: 'usdttrc20',
        });
        sessionStorage.setItem('cryptoPaymentInfo', JSON.stringify(invoiceInfo));
        navigate('/payment/crypto');
      } else {
        navigate('/checkout', { state: { preferredMethod: method, courseId: target.courseId } });
      }
    } catch (error: any) {
      console.error('Instant AI checkout error:', error);
      toast({
        title: 'Chuyển trang thanh toán',
        description: 'Đang mở giao diện thanh toán tiêu chuẩn...',
      });
      navigate('/checkout', { state: { preferredMethod: paymentMethod, courseName: courseNameOrId } });
    } finally {
      setIsProcessing(false);
    }
  };

  return { executeCheckout, isProcessing };
};

// --- THẺ CHỌN CỔNG THANH TOÁN ---
interface ChatPaymentSelectorWidgetProps {
  data: {
    courseName: string;
    action?: string;
  };
  onSelectPayment: (method: string) => void;
}

export const ChatPaymentSelectorWidget: React.FC<ChatPaymentSelectorWidgetProps> = ({ data, onSelectPayment }) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('VNPAY');
  const { executeCheckout, isProcessing } = useInstantAiCheckout();
  const [isMockPaymentDialogOpen, setIsMockPaymentDialogOpen] = useState(false);
  const [mockOrderId, setMockOrderId] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const methods = [
    { id: 'VNPAY', name: 'VNPAY', desc: 'Thẻ ATM / Visa / QR' },
    { id: 'MOMO', name: 'Ví MoMo', desc: 'Thanh toán qua ví điện tử' },
    { id: 'STRIPE', name: 'Stripe (quốc tế)', desc: 'Thẻ Visa / Mastercard' },
    { id: 'PAYPAL', name: 'PayPal', desc: 'Tài khoản PayPal' },
    { id: 'CRYPTO', name: 'Tiền mã hóa (USDT/BTC)', desc: 'Mạng TRC20 / ERC20' },
    { id: 'MOCK_TEST', name: 'Mô phỏng thanh toán', desc: 'Mock Test' },
  ];

  return (
    <div className="mt-3 w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Thanh toán nhanh
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          Bảo mật SSL 256-bit
        </span>
      </div>

      <div className="space-y-3.5 p-4">
        <div className="rounded-lg border border-border p-3">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Khóa học đăng ký
          </span>
          <p className="line-clamp-2 text-sm font-medium leading-snug">
            {data.courseName || 'Khóa học do trợ lý đề xuất'}
          </p>
        </div>

        <div className="space-y-1.5">
          <span className="mb-1 block text-xs font-medium text-foreground">
            Chọn một trong năm cổng thanh toán:
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {methods.map((m) => {
              const isActive = selectedMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`relative flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors disabled:opacity-60 ${
                    isActive
                      ? 'border-primary bg-accent text-accent-foreground'
                      : 'border-border bg-card hover:bg-muted'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold leading-tight">
                      {m.name}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {m.desc}
                    </div>
                  </div>
                  {isActive && (
                    <CheckCircle className="ml-auto h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <Button
            disabled={isProcessing}
            className="h-10 w-full"
            onClick={async () => {
              if (onSelectPayment) onSelectPayment(selectedMethod);
              const returnedOrderId = await executeCheckout(data.courseName, selectedMethod);
              if (selectedMethod === 'MOCK_TEST' && returnedOrderId) {
                setMockOrderId(returnedOrderId as number);
                setIsMockPaymentDialogOpen(true);
              }
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Đang kết nối {selectedMethod}...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" aria-hidden="true" />
                <span>Đặt hàng và thanh toán ({selectedMethod})</span>
              </>
            )}
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Bạn sẽ được chuyển thẳng tới cổng thanh toán, không cần qua trang giỏ hàng.
          </p>
        </div>
      </div>

      <Dialog open={isMockPaymentDialogOpen} onOpenChange={setIsMockPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mô phỏng thanh toán (Mock Test)</DialogTitle>
            <DialogDescription>
              Bạn muốn đơn hàng này thanh toán thành công hay thất bại? Việc này sẽ cập nhật trực tiếp vào hệ thống (giả lập webhook từ cổng thanh toán).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end mt-4">
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  setIsMockPaymentDialogOpen(false);
                  toast({ title: 'Đang xử lý...', description: 'Vui lòng đợi' });
                  await apiHelper.post(`/orders/${mockOrderId}/mock-payment`, { status: 'failed' });
                  toast({ title: 'Đã hủy đơn hàng', variant: 'default' });
                  navigate('/my-courses');
                } catch (e: any) {
                  toast({ title: 'Lỗi', description: e.message || 'Lỗi xử lý', variant: 'destructive' });
                }
              }}
            >
              Thất bại (Hủy đơn)
            </Button>
            <Button
              variant="default"
              onClick={async () => {
                try {
                  setIsMockPaymentDialogOpen(false);
                  toast({ title: 'Đang xử lý...', description: 'Vui lòng đợi' });
                  await apiHelper.post(`/orders/${mockOrderId}/mock-payment`, { status: 'success' });
                  toast({ title: 'Thanh toán thành công!', variant: 'default' });
                  navigate('/my-courses');
                } catch (e: any) {
                  toast({ title: 'Lỗi', description: e.message || 'Lỗi xử lý', variant: 'destructive' });
                }
              }}
            >
              Thành công (Kích hoạt)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


// --- THẺ CHUYỂN SANG CỔNG THANH TOÁN ---
interface CheckoutRedirectWidgetProps {
  data: {
    courseName?: string;
    paymentMethod?: string;
  };
}

export const CheckoutRedirectWidget: React.FC<CheckoutRedirectWidgetProps> = ({ data }) => {
  const method = (data.paymentMethod || 'VNPAY').toUpperCase();
  const { executeCheckout, isProcessing } = useInstantAiCheckout();

  const getMethodName = () => {
    switch (method) {
      case 'MOMO': return 'Ví MoMo';
      case 'STRIPE': return 'Stripe';
      case 'PAYPAL': return 'PayPal';
      case 'CRYPTO': return 'Tiền mã hóa';
      default: return 'VNPAY';
    }
  };

  const methodName = getMethodName();

  return (
    <div className="mt-3 w-full max-w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground">
      <div className="flex flex-col items-center space-y-3 p-5 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold">
            Xác nhận thanh toán qua {methodName}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            Khóa học:{' '}
            <span className="font-medium text-foreground">
              {data.courseName || 'Khóa học đã chọn'}
            </span>
          </p>
        </div>

        <Button
          disabled={isProcessing}
          className="h-10 w-full"
          onClick={() => executeCheckout(data.courseName, method)}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Đang kết nối {methodName}...</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>Mở cổng thanh toán {methodName}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};


// --- THẺ BÁO ĐĂNG KÝ THÀNH CÔNG ---
interface EnrollmentSuccessWidgetProps {
  data: {
    courseName?: string;
  };
}

export const EnrollmentSuccessWidget: React.FC<EnrollmentSuccessWidgetProps> = ({ data }) => {
  const navigate = useNavigate();

  return (
    <div className="mt-3 w-full max-w-[340px] overflow-hidden rounded-xl border border-border bg-card text-card-foreground">
      <div className="flex flex-col items-center p-5 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle className="h-8 w-8" aria-hidden="true" />
        </span>

        <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-success">
          Thanh toán thành công
        </h3>

        <p className="mb-5 line-clamp-2 text-xs text-muted-foreground">
          {data.courseName || 'Khóa học của bạn'}
        </p>

        <div className="w-full space-y-2">
          <Button className="w-full" onClick={() => navigate('/my-courses')}>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            Vào lớp học ngay
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/orders')}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Xem đơn hàng
          </Button>
        </div>
      </div>
    </div>
  );
};
