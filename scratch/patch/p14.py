# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/3t-edu-tech-backend/src/api/ai/chat.service.js'
s = read(p)
OLD = """  const pairs = [];
  for (let i = 0; i < rows.length - 1; i += 1) {
    if (rows[i].Role === 'user' && rows[i + 1].Role === 'assistant') {
      pairs.push({ question: rows[i].Content, answer: rows[i + 1].Content });
      i += 1; // bỏ qua luôn phần tử assistant vừa ghép
    }
  }
  return pairs.slice(-HISTORY_TURNS);"""
NEW = """  const pairs = [];
  for (let i = 0; i < rows.length - 1; i += 1) {
    if (rows[i].Role === 'user' && rows[i + 1].Role === 'assistant') {
      pairs.push({
        question: rows[i].Content,
        answer: rows[i + 1].Content,
        /* [THÊM 20/08/2026] Gửi kèm thẻ giao diện của lượt trả lời đó.
           AI Service cần nó để ánh xạ "khóa số 1 / số 2 / số 3" về đúng thẻ
           trong danh sách đã hiển thị. Thiếu trường này, nhánh ánh xạ chính xác
           trong `_resolve_course_reference` là mã chết và hệ thống phải đoán
           bằng cách bốc chuỗi in đậm thứ N trong câu trả lời trước — một phép
           đoán sai thường xuyên, và cái sai đó dẫn thẳng tới thẻ thanh toán
           cho một khóa học khác.

           Dữ liệu lấy từ cột UiWidgetJson đã lưu sẵn nên không phát sinh truy
           vấn mới. */
        ui_widget: safeJsonParse(rows[i + 1].UiWidgetJson, null),
      });
      i += 1; // bỏ qua luôn phần tử assistant vừa ghép
    }
  }
  return pairs.slice(-HISTORY_TURNS);"""
s = sub(s, OLD, NEW, 'buildHistoryFromDb')
write(p, s)
print('chat.service.js OK')

# ---------- useChatbot.ts: L13 lessonId trong deps ----------
p = '/edu-ai-learning-hub/src/hooks/useChatbot.ts'
s = read(p)
s = sub(s, """  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages || []
  );""",
"""  /* [THÊM 20/08/2026] `lessonId` chỉ có ý nghĩa với scope LESSON.
     Với scope COURSE, hook vẫn nhận `lessonId` từ trang học (nó đổi mỗi lần
     người dùng chuyển bài) nhưng lại ép về null khi gọi API. Vì biến đó nằm
     trong mảng phụ thuộc của hiệu ứng khởi tạo, mỗi lần chuyển bài là một lượt
     POST /ai/sessions + GET /messages hoàn toàn thừa (đều tính vào giới hạn tần
     suất), kèm một lần dựng lại mảng tin nhắn — cuốn mất lời chào và các nút
     gợi ý đang hiển thị giữa chừng cuộc trò chuyện. */
  const effectiveLessonId = scope === 'LESSON' ? lessonId : null;

  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages || []
  );""", 'effectiveLessonId')

s = s.replace("""          lessonId: scope === 'LESSON' ? lessonId : null,
        });
        if (!active) return;
        setSessionId(session.sessionId);""",
"""          lessonId: effectiveLessonId,
        });
        if (!active) return;
        setSessionId(session.sessionId);""")
s = sub(s, """    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, scope, courseId, lessonId]);""",
"""    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, scope, courseId, effectiveLessonId]);""", 'deps hieu ung khoi tao')

s = sub(s, """          lessonId: scope === 'LESSON' ? lessonId : null,
        });
        setSessionId(session.sessionId);""",
"""          lessonId: effectiveLessonId,
        });
        setSessionId(session.sessionId);""", 'lessonId trong clearChatHistory')
s = sub(s, """  }, [sessionId, initialMessages, enabled, scope, courseId, lessonId]);""",
"""  }, [sessionId, initialMessages, enabled, scope, courseId, effectiveLessonId]);""",
"deps clearChatHistory")
write(p, s)
print('useChatbot.ts OK')
