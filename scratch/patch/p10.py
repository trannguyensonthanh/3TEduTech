# -*- coding: utf-8 -*-
import io, sys
ROOT = sys.argv[1]
def read(p): return io.open(ROOT + p, encoding='utf-8').read()
def write(p, s): io.open(ROOT + p, 'w', encoding='utf-8', newline='\n').write(s)
def sub(s, old, new, label):
    assert s.count(old) == 1, 'KHONG TIM THAY: ' + label
    return s.replace(old, new)

p = '/edu-ai-learning-hub/src/pages/AiMasterChat.tsx'
s = read(p)

# --- 1. import them ---
s = sub(s, """import {
  getOrCreateChatSession,
  streamChatMessage,
  UIWidgetData,
} from '@/services/ai.service';""",
"""import {
  getOrCreateChatSession,
  getSessionMessages,
  archiveChatSession,
  streamChatMessage,
  UIWidgetData,
} from '@/services/ai.service';""", 'import ai.service')

# --- 2. ChatSession co them serverSessionId ---
s = sub(s, """interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}""",
"""interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  /**
   * [THÊM 20/08/2026] Số hiệu phiên THẬT ở phía máy chủ.
   *
   * Trước đây trang này chỉ giữ một `serverSessionIdRef` DUY NHẤT cho cả
   * trang, và nó luôn trỏ về đúng một phiên MASTER. Hệ quả: mọi "hội thoại"
   * trong thanh bên chỉ là các mảng tin nhắn khác nhau trong localStorage,
   * còn phía máy chủ tất cả dùng chung một dòng lịch sử. Bấm "Hội thoại mới"
   * xong hỏi câu đầu tiên thì mô hình vẫn trả lời tiếp chuyện cũ, vì backend
   * đọc 5 lượt gần nhất của chính phiên đó từ CSDL.
   *
   * Nay mỗi hội thoại trong thanh bên gắn với một phiên riêng.
   */
  serverSessionId?: number | null;
}""", 'interface ChatSession')

# --- 3. thay ensureServerSession ---
OLD_ENSURE = """  const serverSessionIdRef = useRef<number | null>(null);
  const ensureServerSession = async (): Promise<number> => {
    if (serverSessionIdRef.current !== null) return serverSessionIdRef.current;
    const session = await getOrCreateChatSession({ scope: 'MASTER' });
    serverSessionIdRef.current = session.sessionId;
    return session.sessionId;
  };"""
NEW_ENSURE = """  const abortRef = useRef<AbortController | null>(null);

  /**
   * Lấy (hoặc tạo) phiên máy chủ gắn với hội thoại đang mở ở thanh bên.
   *
   * `forceNew` chỉ bật cho hội thoại được tạo bằng nút "Hội thoại mới" và chưa
   * từng gửi tin nào — đó là lúc duy nhất người dùng thực sự muốn một dòng
   * lịch sử mới. Các lần sau dùng lại đúng phiên đã gắn.
   */
  const ensureServerSession = async (
    localSessionId: string,
    forceNew: boolean
  ): Promise<number> => {
    const bound = sessionsRef.current.find((s) => s.id === localSessionId);
    if (bound?.serverSessionId) return bound.serverSessionId;

    const session = await getOrCreateChatSession({ scope: 'MASTER', forceNew });
    setSessions((prev) =>
      prev.map((s) =>
        s.id === localSessionId
          ? { ...s, serverSessionId: session.sessionId }
          : s
      )
    );
    return session.sessionId;
  };"""
s = sub(s, OLD_ENSURE, NEW_ENSURE, 'ensureServerSession')

# --- 4. them sessionsRef + nap lich su khi doi hoi thoai ---
OLD_SAVE = """  // Save to LocalStorage whenever sessions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Error saving sessions:', e);
    }
  }, [sessions]);"""
NEW_SAVE = """  /* Bản sao mới nhất của `sessions` dùng trong các hàm bất đồng bộ.
     Đọc thẳng `sessions` trong một hàm async là đọc giá trị đã đóng băng ở lần
     render nó được tạo ra — với luồng chat kéo dài vài giây thì giá trị đó gần
     như chắc chắn đã cũ. */
  const sessionsRef = useRef<ChatSession[]>(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // Save to LocalStorage whenever sessions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Error saving sessions:', e);
    }
  }, [sessions]);

  /* ------------------------------------------------------------------------
     Nạp lịch sử THẬT từ máy chủ cho hội thoại đang mở.

     [THÊM 20/08/2026] Trang này trước đây chỉ đọc localStorage. Mở trên máy
     khác, hay sau khi xóa cache trình duyệt, người dùng thấy khung chat trắng
     trơn trong khi mô hình vẫn nhớ toàn bộ cuộc trò chuyện — vì lịch sử nằm ở
     CSDL. Nay hai bên khớp nhau.

     Chỉ nạp khi hội thoại ĐÃ gắn với một phiên máy chủ và đang trống ở phía
     trình duyệt; hội thoại đã có tin nhắn cục bộ thì giữ nguyên để không ghi đè
     phần người dùng đang đọc dở. */
  const hydratedRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    const current = sessions.find((s) => s.id === activeSessionId);
    const serverId = current?.serverSessionId;
    if (!serverId || hydratedRef.current.has(serverId)) return;

    const localCount = (current?.messages || []).filter(
      (m) => !m.id.startsWith('welcome-')
    ).length;
    if (localCount > 0) {
      hydratedRef.current.add(serverId);
      return;
    }

    let active = true;
    hydratedRef.current.add(serverId);
    (async () => {
      try {
        const { messages: stored } = await getSessionMessages(serverId);
        if (!active || stored.length === 0) return;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? {
                  ...s,
                  messages: stored.map((m) => ({
                    id: `db-${m.messageId}`,
                    text: m.content,
                    sender: m.role === 'user' ? ('user' as const) : ('bot' as const),
                    sources: m.sources,
                    uiWidget: m.uiWidget,
                    timestamp: new Date(m.createdAt).getTime(),
                  })),
                }
              : s
          )
        );
      } catch (e) {
        // Không nạp được lịch sử thì vẫn dùng được khung chat — chỉ ghi log.
        console.error('Không nạp được lịch sử hội thoại từ máy chủ:', e);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId, sessions.find((s) => s.id === activeSessionId)?.serverSessionId]);"""
s = sub(s, OLD_SAVE, NEW_SAVE, 'khoi luu localStorage')

# --- 5. cleanup: huy stream khi roi trang ---
s = sub(s, """  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    };
  }, []);""",
"""  /* Dọn khi rời trang.

     [SỬA 20/08/2026] Bản cũ chỉ dọn bộ đếm nhả chữ, KHÔNG hủy luồng SSE. Điều
     hướng khỏi trang giữa lúc AI đang trả lời (ứng dụng một trang, component bị
     gỡ nhưng `fetch` vẫn sống) khiến backend không nhận được sự kiện `close`,
     nên AI Service tiếp tục sinh chữ tới hết câu trả lời cho một người đã bỏ đi
     — đốt hạn mức mô hình vô ích. Hook `useChatbot` đã làm đúng việc này từ
     đầu bằng AbortController; riêng trang này bỏ sót. */
  useEffect(() => {
    return () => {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      abortRef.current?.abort();
    };
  }, []);""", 'cleanup unmount')

# --- 6. handleNewSession: danh dau la phien moi ---
s = sub(s, """      messages: [{ ...initialWelcomeMessage, id: `welcome-${Date.now()}`, timestamp: Date.now() }],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);""",
"""      messages: [{ ...initialWelcomeMessage, id: `welcome-${Date.now()}`, timestamp: Date.now() }],
      // Chưa gắn phiên máy chủ. Lần gửi tin đầu tiên sẽ tạo phiên MỚI
      // (forceNew) thay vì dùng lại phiên MASTER đang mở — nếu không, "Hội
      // thoại mới" chỉ mới ở phía trình duyệt còn mô hình vẫn nhớ chuyện cũ.
      serverSessionId: null,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);""", 'handleNewSession')

# --- 7. handleDeleteSession: luu tru phien phia may chu ---
s = sub(s, """    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
    toast({
      title: '🗑️ Đã xóa phiên',
      description: 'Lịch sử cuộc hội thoại đã được loại bỏ.',
    });""",
"""    /* [THÊM 20/08/2026] Lưu trữ luôn phiên phía máy chủ.
       Bản cũ chỉ xóa mục trong localStorage; phía CSDL phiên vẫn mở, nên lượt
       hỏi tiếp theo mô hình vẫn nhận đúng lịch sử mà người dùng tưởng đã xóa.
       Backend chỉ ĐÁNH DẤU lưu trữ chứ không xóa dữ liệu (thống kê cần giữ). */
    const removed = sessions.find((s) => s.id === id);
    if (removed?.serverSessionId) {
      archiveChatSession(removed.serverSessionId).catch((e) =>
        console.error('Không lưu trữ được phiên phía máy chủ:', e)
      );
    }

    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
    toast({
      title: '🗑️ Đã xóa phiên',
      description: 'Lịch sử cuộc hội thoại đã được loại bỏ.',
    });""", 'handleDeleteSession')

# --- 8. handleSendMessage: dung ensureServerSession moi + signal ---
s = sub(s, """    try {
      const sessionId = await ensureServerSession();
      await streamChatMessage(sessionId, textToSend, {""",
"""    try {
      /* Hội thoại chưa gắn phiên máy chủ => đây là hội thoại vừa tạo bằng nút
         "Hội thoại mới", nên yêu cầu backend tạo phiên MỚI thay vì dùng lại. */
      const isFreshLocalSession = !activeSession.serverSessionId;
      const sessionId = await ensureServerSession(
        activeSession.id,
        isFreshLocalSession
      );

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      await streamChatMessage(sessionId, textToSend, {""", 'goi ensureServerSession')

# them signal vao cuoi loi goi streamChatMessage
OLD_TAIL = """        },
      });
    } catch (err) {
      /* Lỗi ở ĐÂY là lỗi trước khi luồng chạy — chủ yếu là không tạo được phiên
         (mất mạng, hết hạn đăng nhập). Lỗi giữa luồng đã có onError lo. */"""
NEW_TAIL = """        },
      }, abortRef.current.signal);
    } catch (err) {
      /* Lỗi ở ĐÂY là lỗi trước khi luồng chạy — chủ yếu là không tạo được phiên
         (mất mạng, hết hạn đăng nhập). Lỗi giữa luồng đã có onError lo. */"""
s = sub(s, OLD_TAIL, NEW_TAIL, 'them signal')

# --- 9. copyToClipboard: don setTimeout ---
s = sub(s, """  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };""",
"""  /* [SỬA 20/08/2026] Giữ tham chiếu tới bộ hẹn giờ để dọn khi rời trang.
     Bản cũ bỏ rơi `setTimeout`: sao chép rồi rời trang ngay trong hai giây sẽ
     gọi setState trên một component đã bị gỡ. */
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedMsgId(null), 2000);
  };""", 'copyToClipboard')

write(p, s)
print('AiMasterChat.tsx OK')
