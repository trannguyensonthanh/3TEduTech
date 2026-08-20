# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/edu-ai-learning-hub/src/components/chatbot/widgets/index.tsx'
s = read(p)

OLD = """      // 1. Tìm chính xác thông tin khóa học trong hệ thống để đưa giá tiền thật (ví dụ 499k) vào giỏ hàng
      const courses = coursesResponse?.courses || [];
      const target = courses.find((c: any) => {
        if (!c) return false;
        if (typeof courseNameOrId === 'number' && c.courseId === courseNameOrId) return true;
        if (typeof courseNameOrId === 'string' && courseNameOrId) {
          const cleanInput = courseNameOrId.toLowerCase().replace(/khóa học[:\\s]*/i, '').trim();
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
"""

NEW = """      /* ====================================================================
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
          const cleanInput = courseNameOrId.toLowerCase().replace(/khóa học[:\\s]*/i, '').trim();
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
"""
s = sub(s, OLD, NEW, 'khoi executeCheckout')

# gian luoc nhanh PAYPAL (target chac chan ton tai tu day tro di)
s = sub(s,
  "        navigate('/checkout', { state: { preferredMethod: method, courseName: target?.courseName || courseNameOrId, courseId: target?.courseId } });",
  "        navigate('/checkout', { state: { preferredMethod: method, courseName: target.courseName, courseId: target.courseId } });",
  'nhanh PAYPAL')
s = sub(s,
  "        navigate('/checkout', { state: { preferredMethod: method, courseId: target?.courseId } });",
  "        navigate('/checkout', { state: { preferredMethod: method, courseId: target.courseId } });",
  'nhanh mac dinh')
write(p, s)
print('widgets/index.tsx OK')
