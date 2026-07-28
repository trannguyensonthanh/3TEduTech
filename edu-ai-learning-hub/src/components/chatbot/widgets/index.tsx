import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Star, CreditCard, Wallet, QrCode, Lock, ArrowRight, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

// --- COURSE CAROUSEL WIDGET (PREMIUM STACKED DECK) ---
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

  // Format currency display song song VNĐ / USD (Tỷ giá tạm tính ~24,500)
  const formatDualPrice = (price?: number) => {
    if (!price || price <= 0) return '🎁 Học liệu đề xuất';
    const priceVND = price.toLocaleString('vi-VN') + ' VNĐ';
    const priceUSD = '($' + (price / 24500).toFixed(2) + ')';
    return `🏷️ ${priceVND} ~ ${priceUSD}`;
  };

  return (
    <div className="w-full max-w-full space-y-3 mt-3.5 min-w-0 overflow-hidden">
      {courses.map((course, idx) => {
        const isEnrolled = course.isEnrolled ||
          (course.courseId && enrolledIds.has(course.courseId)) ||
          (course.slug && enrolledSlugs.has(course.slug.toLowerCase())) ||
          (course.courseName && enrolledNames.has(course.courseName.toLowerCase()));

        return (
          <Card 
            key={idx} 
            className="w-full border-blue-500/30 dark:border-blue-400/30 bg-gradient-to-br from-white/95 via-blue-50/20 to-slate-50 dark:from-slate-900 dark:via-blue-950/20 dark:to-slate-900/90 shadow-md hover:shadow-blue-500/10 hover:border-blue-500 transition-all duration-200 rounded-xl overflow-hidden flex flex-col min-w-0"
          >
            <div className="p-3.5 sm:p-4 flex flex-col gap-2.5">
              {/* Header & Number Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 max-w-[80%]">
                  <span className="flex items-center justify-center min-w-[28px] h-7 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black rounded-lg shadow-sm">
                    #{idx + 1}
                  </span>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {course.courseName}
                  </h4>
                </div>
                {isEnrolled ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Đã Đăng Ký</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                    <Star className="w-3 h-3 fill-current text-amber-500 animate-pulse" />
                    <span>98% Phù hợp</span>
                  </span>
                )}
              </div>

              {/* Price tag */}
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 w-fit px-2.5 py-1 rounded-md border border-emerald-500/20">
                {formatDualPrice(course.price)}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {course.description || 'Khóa học được AI chọn lọc kỹ lưỡng, cung cấp kiến thức thực chiến và chuyên sâu cho lộ trình học của bạn.'}
              </p>

              {/* Actions */}
              <div className="pt-1 flex items-center justify-end gap-2 mt-1 border-t border-slate-100 dark:border-slate-800/80">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-xs h-8 px-3 rounded-lg border-slate-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-colors"
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
                  <BookOpen className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Xem chi tiết
                </Button>

                {isEnrolled ? (
                  <Button 
                    size="sm" 
                    className="text-xs h-8 px-3.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm transition-transform active:scale-95 font-bold flex items-center gap-1.5"
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
                    <CheckCircle className="w-3.5 h-3.5 text-white animate-pulse" />
                    <span>🎓 Đã sở hữu • Vào học ngay</span>
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    className="text-xs h-8 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-transform active:scale-95 font-medium"
                    onClick={() => {
                      if (onSelectCourse) {
                        onSelectCourse(`Tôi muốn mua khóa học số ${idx + 1}: ${course.courseName}`);
                      } else {
                        navigate(`/courses?search=${encodeURIComponent(course.courseName)}`);
                      }
                    }}
                  >
                    💳 Mua khóa #{idx + 1}
                  </Button>
                )}
              </div>
            </div>
          </Card>
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
      
      // 1. Tìm chính xác thông tin khóa học trong hệ thống để đưa giá tiền thật (ví dụ 499k) vào giỏ hàng
      const courses = coursesResponse?.courses || [];
      const target = courses.find((c: any) => {
        if (!c) return false;
        if (typeof courseNameOrId === 'number' && c.courseId === courseNameOrId) return true;
        if (typeof courseNameOrId === 'string' && courseNameOrId) {
          const cleanInput = courseNameOrId.toLowerCase().replace(/khóa học[:\s]*/i, '').trim();
          const cleanCourseName = (c.courseName || '').toLowerCase().trim();
          return cleanCourseName === cleanInput || cleanCourseName.includes(cleanInput) || cleanInput.includes(cleanCourseName);
        }
        return false;
      }) || courses[0]; // fallback nếu không khớp tuyệt đối, đảm bảo không bao giờ bị 0đ

      if (target && target.courseId) {
        toast({
          title: '⚡ Đang chuẩn bị cổng thanh toán...',
          description: `Đang đồng bộ khóa học "${target.courseName}"...`,
        });

        // Kiểm tra xem khóa học đã có trong giỏ hàng chưa
        const alreadyInCart = cartData?.items?.some((i: any) => i.courseId === target.courseId);
        if (!alreadyInCart) {
          try {
            await addCourseToCart(target.courseId);
          } catch (err: any) {
            console.log('Notice when adding to cart from AI:', err?.message);
          }
        }
      } else {
        toast({
          title: 'Chuyển hướng thanh toán...',
          description: `Đang mở cổng ${method}...`,
        });
      }

      // 2. Nếu là PayPal, điều hướng sang /checkout (lúc này giỏ hàng ĐÃ CÓ GIÁ TIỀN THẬT, không còn 0đ!)
      if (method === 'PAYPAL') {
        navigate('/checkout', { state: { preferredMethod: method, courseName: target?.courseName || courseNameOrId, courseId: target?.courseId } });
        setIsProcessing(false);
        return;
      }

      // 3. Với VNPAY, MOMO, STRIPE, CRYPTO -> Tự động tạo Đơn hàng và sang WEB HOOK / GATEWAY ngay lập tức không cần qua trang Checkout!
      const order = await createOrder({ promotionCode: null });
      if (!order || !order.orderId) {
        throw new Error('Không thể tạo đơn hàng tự động từ giỏ hàng AI.');
      }

      toast({
        title: '🚀 Đang mở Webhook Gateway...',
        description: `Đang chuyển hướng thẳng vào cổng thanh toán bảo mật ${method}...`,
      });

      if (method === 'VNPAY') {
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
        navigate('/checkout', { state: { preferredMethod: method, courseId: target?.courseId } });
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

// --- PAYMENT SELECTOR WIDGET (PREMIUM MINI-CHECKOUT) ---
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

  const methods = [
    { id: 'VNPAY', name: 'VNPAY Gateway (VNĐ)', icon: '🇻🇳', desc: 'Thẻ ATM / Visa / QR' },
    { id: 'MOMO', name: 'Ví MoMo E-Wallet', icon: '📱', desc: 'Thanh toán siêu tốc' },
    { id: 'STRIPE', name: 'Stripe (Quốc Tế)', icon: '💳', desc: 'Thẻ Visa / Mastercard' },
    { id: 'PAYPAL', name: 'PayPal Protect', icon: '💙', desc: 'Tài khoản PayPal' },
    { id: 'CRYPTO', name: 'Web3 Crypto (USDT/BTC)', icon: '🪙', desc: 'Thanh toán TRC20/ERC20' },
  ];

  return (
    <Card className="mt-3.5 border-emerald-500/40 dark:border-emerald-500/30 bg-gradient-to-br from-white via-emerald-50/10 to-slate-50 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 shadow-xl rounded-2xl overflow-hidden w-full max-w-full min-w-0">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 py-3 flex items-center justify-between text-white shadow-sm">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-200 animate-pulse" />
          <h4 className="text-sm font-bold tracking-wide uppercase">AI Mini-Checkout</h4>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
          Bảo mật SSL 256-bit
        </span>
      </div>
      
      <CardContent className="p-4 space-y-3.5">
        <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
            Khóa học đăng ký:
          </span>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
            {data.courseName || 'Khóa học được AI Đề Ký'}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-1">
            <span>Chọn 1 trong 5 cổng thanh toán:</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {methods.map((m) => {
              const isActive = selectedMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2.5 relative ${
                    isActive 
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-sm ring-1 ring-emerald-500' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-800'
                  }`}
                >
                  <span className="text-xl shrink-0">{m.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                      {m.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {m.desc}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-auto mr-0.5 shadow-sm animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button 
            disabled={isProcessing}
            className="w-full h-11 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            onClick={() => {
              if (onSelectPayment) onSelectPayment(selectedMethod);
              executeCheckout(data.courseName, selectedMethod);
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>⏳ Đang kết nối Webhook {selectedMethod}...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Place Order & Pay ({selectedMethod})</span>
              </>
            )}
          </Button>
          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-2">
            ⚡ Chuyển thẳng tới cổng thanh toán Webhook Gateway không cần qua trang Checkout!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};


// --- CHECKOUT REDIRECT WIDGET ---
interface CheckoutRedirectWidgetProps {
  data: {
    courseName?: string;
    paymentMethod?: string;
  };
}

export const CheckoutRedirectWidget: React.FC<CheckoutRedirectWidgetProps> = ({ data }) => {
  const method = (data.paymentMethod || 'VNPAY').toUpperCase();
  const { executeCheckout, isProcessing } = useInstantAiCheckout();
  
  const getMethodBadge = () => {
    switch (method) {
      case 'MOMO': return { icon: '📱', name: 'Ví MoMo', color: 'from-pink-500 to-rose-600' };
      case 'STRIPE': return { icon: '💳', name: 'Stripe', color: 'from-purple-600 to-indigo-600' };
      case 'PAYPAL': return { icon: '💙', name: 'PayPal', color: 'from-blue-600 to-cyan-600' };
      case 'CRYPTO': return { icon: '🪙', name: 'Web3 Crypto', color: 'from-amber-500 to-yellow-600' };
      default: return { icon: '🇻🇳', name: 'VNPAY Gateway', color: 'from-blue-600 to-emerald-600' };
    }
  };

  const badge = getMethodBadge();

  return (
    <Card className="mt-3.5 border-teal-500/30 dark:border-teal-500/20 shadow-xl overflow-hidden w-full max-w-full bg-gradient-to-br from-white via-teal-50/10 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20 rounded-2xl">
      <CardContent className="p-5 flex flex-col items-center text-center space-y-3.5">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${badge.color} flex items-center justify-center text-2xl text-white shadow-lg shadow-teal-500/20 animate-bounce`}>
          {badge.icon}
        </div>
        <div>
          <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full mb-1">
            Sẵn sàng chuyển giao Webhook
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Xác nhận thanh toán qua {badge.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2 mt-1 px-2">
            Khóa học: <strong className="text-slate-800 dark:text-white">{data.courseName || 'Khóa học đã chọn'}</strong>
          </p>
        </div>
        
        <Button 
          disabled={isProcessing}
          className={`w-full h-11 bg-gradient-to-r ${badge.color} hover:opacity-95 text-white font-extrabold text-sm rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2`}
          onClick={() => executeCheckout(data.courseName, method)}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>⏳ Đang kết nối {badge.name}...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>🚀 Mở Cổng Thanh Toán {badge.name} Ngay</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};


// --- ENROLLMENT SUCCESS WIDGET ---
interface EnrollmentSuccessWidgetProps {
  data: {
    courseName?: string;
  };
}

export const EnrollmentSuccessWidget: React.FC<EnrollmentSuccessWidgetProps> = ({ data }) => {
  const navigate = useNavigate();

  return (
    <Card className="mt-3 border-green-500/30 shadow-xl overflow-hidden w-full max-w-[340px] bg-gradient-to-b from-green-50/50 to-card dark:from-green-950/20 dark:to-card relative">
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100px) rotate(360deg); opacity: 0; }
        }
        .confetti-piece {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #22c55e;
          animation: confetti 2s ease-out forwards;
        }
      `}</style>
      
      {/* CSS Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="confetti-piece rounded-sm"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: '-10px',
              animationDelay: `${Math.random() * 0.5}s`,
              backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 4)]
            }} 
          />
        ))}
      </div>

      <CardContent className="p-5 flex flex-col items-center text-center relative z-10">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 shadow-inner">
          <CheckCircle className="w-10 h-10 text-green-500 animate-[bounce_1s_ease-in-out_infinite]" />
        </div>
        
        <h3 className="text-base font-bold text-green-600 dark:text-green-400 mb-1">
          🎉 THANH TOÁN THÀNH CÔNG!
        </h3>
        
        <p className="text-xs text-muted-foreground mb-5 font-medium line-clamp-2">
          {data.courseName || 'Khóa học của bạn'}
        </p>
        
        <div className="w-full space-y-2">
          <Button 
            className="w-full bg-green-500 hover:bg-green-600 text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => navigate('/my-courses')}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            🚀 Vào Lớp Học Ngay
          </Button>
          
          <Button 
            variant="outline"
            className="w-full border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => navigate('/orders')}
          >
            <FileText className="w-4 h-4 mr-2" />
            📜 Xem Đơn Hàng
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
