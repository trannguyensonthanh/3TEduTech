# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/edu-ai-learning-hub/src/components/courseLearn/AIAssistantDialog.tsx'
s = read(p)

s = sub(s, """     useStreaming: false — trợ lý trong khóa học trả về kèm dữ liệu giọng nói
     (trường `voice`), mà giọng nói chỉ có ở phản hồi trọn gói chứ không đi
     kèm luồng token. Bật streaming ở đây sẽ làm mất tính năng đọc thành tiếng. */
  const { messages, isTyping, addUserMessage, confirmFallback } = useChatbot({""",
"""     useStreaming: false — GIỮ NGUYÊN, nhưng lý do ghi ở bản cũ là SAI.

     [SỬA 20/08/2026] Chú thích cũ nói tắt streaming để giữ trường `voice` cho
     avatar 3D đọc thành tiếng. Trường đó KHÔNG TỒN TẠI: `QueryResponse` phía AI
     Service chỉ có answer / sources / suggested_questions / is_fallback_prompt,
     và chuỗi "voice" không xuất hiện trong bất kỳ tệp .py nào. Vì FastAPI khai
     `response_model=QueryResponse` nên trường lạ còn bị cắt bỏ nếu có. Nghĩa là
     trợ lý trong khóa học đang mất CẢ streaming lẫn giọng nói, đổi lấy một tính
     năng chưa từng được triển khai.

     Lý do THẬT để giữ `false` lúc này: `streamMessage` phía backend luôn gọi
     endpoint của tác tử bán hàng, không phân nhánh theo scope, và AI Service
     chưa có `course-query-stream`. Bật streaming ở đây sẽ khiến câu hỏi về bài
     giảng đi qua tác tử bán hàng và mất hoàn toàn phần truy hồi theo khóa học.
     (Backend nay chặn rõ ràng trường hợp đó thay vì im lặng trả lời sai.) */
  const {
    messages,
    isTyping,
    isLoadingHistory,
    addUserMessage,
    confirmFallback,
  } = useChatbot({""", 'destructure useChatbot')

# Hien thi sources
OLD_SRC = """                          {msg.isFallbackPrompt && msg.originalQuery && (
                            <div className="mt-2 flex gap-2">
                              <Button 
                                size="sm" 
                                className="w-full bg-warning text-warning-foreground hover:bg-warning/90"
                                onClick={() => confirmFallback(msg.originalQuery!)}
                              >
                                Đồng ý dùng kiến thức chung
                              </Button>
                            </div>
                          )}"""
NEW_SRC = """                          {/* [THÊM 20/08/2026] Hiện nguồn trích dẫn.
                              Backend vẫn trả về `sources` và hook vẫn lưu lại,
                              nhưng giao diện này chưa bao giờ đọc tới — nên học
                              viên không biết câu trả lời lấy từ bài nào. Trang
                              AI Master có hiển thị, nên đây là thiếu sót chứ
                              không phải chủ ý. */}
                          {msg.sender === 'bot' &&
                            msg.sources &&
                            msg.sources.length > 0 && (
                              <div className='mt-1 border-t border-border/60 pt-2'>
                                <span className='mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground'>
                                  Trích từ giáo trình
                                </span>
                                <ul className='space-y-0.5'>
                                  {msg.sources.slice(0, 3).map((src, i) => (
                                    <li
                                      key={i}
                                      className='truncate text-[11px] text-muted-foreground'
                                      title={src.content}
                                    >
                                      • {src.file_name}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          {msg.isFallbackPrompt && msg.originalQuery && (
                            <div className="mt-2 flex gap-2">
                              <Button 
                                size="sm" 
                                className="w-full bg-warning text-warning-foreground hover:bg-warning/90"
                                onClick={() => confirmFallback(msg.originalQuery!)}
                              >
                                Đồng ý dùng kiến thức chung
                              </Button>
                            </div>
                          )}"""
s = sub(s, OLD_SRC, NEW_SRC, 'khoi sources')

# Khoa o nhap trong luc nap lich su
s = sub(s, """                      placeholder='Ask anything about this lesson...'
                      className='pr-12 resize-none text-sm min-h-[44px] max-h-[120px] rounded-full py-2.5 px-4'
                      rows={1}
                      disabled={isTyping || isSpeaking}""",
"""                      placeholder={
                        isLoadingHistory
                          ? 'Đang mở phiên trò chuyện…'
                          : 'Hỏi bất cứ điều gì về bài học này…'
                      }
                      className='pr-12 resize-none text-sm min-h-[44px] max-h-[120px] rounded-full py-2.5 px-4'
                      rows={1}
                      /* [SỬA 20/08/2026] Khóa ô nhập trong lúc phiên đang khởi
                         tạo. Trước đây người dùng gõ và gửi được ngay, nhưng
                         `sessionId` còn null nên nhận về câu "Chưa kết nối được
                         phiên trò chuyện. Vui lòng tải lại trang." — trong khi
                         thực tế chỉ cần chờ thêm một nhịp. */
                      disabled={isTyping || isSpeaking || isLoadingHistory}""", 'textarea')
s = sub(s, """                      disabled={!input.trim() || isTyping || isSpeaking}""",
"""                      disabled={
                        !input.trim() || isTyping || isSpeaking || isLoadingHistory
                      }""", 'nut gui')
write(p, s)
print('AIAssistantDialog.tsx OK')
