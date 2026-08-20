# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY (hoac trung lap): ' + label
    return s.replace(old, new)

# ============ 1. Index.tsx — gỡ ChatbotUI trùng ============
p = '/edu-ai-learning-hub/src/pages/Index.tsx'
s = read(p)
s = sub(s, 'import ChatbotUI from "@/components/chatbot/ChatbotUI";\n', '',
        'import ChatbotUI trong Index')
s = sub(s, '      <CallToAction />\n      <ChatbotUI />\n',
        '      <CallToAction />\n'
        '      {/* [GO 20/08/2026] KHONG dat <ChatbotUI /> o day.\n'
        '          Layout da render san mot cai (components/layout/Layout.tsx), nen\n'
        '          trang chu dang co HAI khung chat noi chong len nhau o goc phai\n'
        '          duoi: hai nut, hai phien, bam nut nay thi khung kia van con. */\n',
        'ChatbotUI trong JSX Index')
write(p, s)
print('Index.tsx OK')

# ============ 2. ChatbotUI.tsx — bo console.log, sua L4 ============
p = '/edu-ai-learning-hub/src/components/chatbot/ChatbotUI.tsx'
s = read(p)
s = sub(s, "\n  console.log('Suggested Questions:', suggestedQuestions);\n", '\n',
        'console.log rac')
OLD = """  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('chatbot_payment') === 'success') {
      setIsOpen(true);
      pushBotMessage('🎉 Chúc mừng bạn đã đăng ký khóa học thành công!', { 
        type: 'ENROLLMENT_SUCCESS', 
        data: {} 
      });
      // Clean URL query param
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, [pushBotMessage]);"""
NEW = """  /* ------------------------------------------------------------------------
     Quay về từ cổng thanh toán.

     [SỬA 20/08/2026] Bản cũ đẩy tin nhắn chúc mừng NGAY trong hiệu ứng này,
     và tin nhắn đó luôn bị cuốn trôi vài trăm mili giây sau. Lý do:
     `setIsOpen(true)` làm `enabled` của useChatbot đổi từ false sang true, kích
     hoạt lại hiệu ứng khởi tạo phiên; hiệu ứng đó kết thúc bằng
     `setMessages(...)` THAY THẾ CẢ MẢNG bằng lịch sử đọc từ CSDL — cuốn theo
     luôn tin nhắn vừa đẩy vào. Vì đây là nơi DUY NHẤT trong hệ thống sinh ra
     widget ENROLLMENT_SUCCESS (AI Service không hề sinh loại này), widget đó
     thực tế chưa bao giờ tồn tại quá một nhịp render.

     Nay tách làm hai bước: hiệu ứng thứ nhất chỉ ghi nhận "có thanh toán thành
     công" và mở khung chat; hiệu ứng thứ hai chờ phiên nạp xong rồi mới đẩy
     tin nhắn. `hasCelebratedRef` để không đẩy lại khi component render lại. */
  const [pendingCelebration, setPendingCelebration] = useState(false);
  const hasCelebratedRef = useRef(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('chatbot_payment') === 'success') {
      setIsOpen(true);
      setPendingCelebration(true);
      // Dọn tham số khỏi URL để bấm F5 không chúc mừng lại lần nữa.
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  useEffect(() => {
    if (!pendingCelebration) return;
    if (isLoadingHistory || !sessionId) return;
    if (hasCelebratedRef.current) return;
    hasCelebratedRef.current = true;
    setPendingCelebration(false);
    pushBotMessage('🎉 Chúc mừng bạn đã đăng ký khóa học thành công!', {
      type: 'ENROLLMENT_SUCCESS',
      data: {},
    });
  }, [pendingCelebration, isLoadingHistory, sessionId, pushBotMessage]);"""
s = sub(s, OLD, NEW, 'khoi chatbot_payment')
write(p, s)
print('ChatbotUI.tsx (phan 1) OK')
