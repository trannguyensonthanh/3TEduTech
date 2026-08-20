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

# 1. them co forceNewOnFirstMessage vao interface
s = sub(s, """  serverSessionId?: number | null;
}""",
"""  serverSessionId?: number | null;
  /**
   * Chỉ bật cho hội thoại vừa được tạo bằng nút "Hội thoại mới".
   *
   * Cần phân biệt với "chưa gắn phiên" nói chung: một hội thoại cũ đọc lên từ
   * localStorage của bản trước cũng chưa có `serverSessionId`, nhưng nó KHÔNG
   * nên tạo phiên mới — làm vậy sẽ bỏ rơi lịch sử đang có ở máy chủ. Chỉ khi
   * người dùng chủ động bấm "Hội thoại mới" thì việc cắt đứt ngữ cảnh cũ mới
   * đúng ý họ.
   */
  forceNewOnFirstMessage?: boolean;
}""", 'interface flag')

# 2. ensureServerSession: dung co
s = sub(s, """  const ensureServerSession = async (
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
  };""",
"""  const ensureServerSession = async (localSessionId: string): Promise<number> => {
    const bound = sessionsRef.current.find((s) => s.id === localSessionId);
    if (bound?.serverSessionId) return bound.serverSessionId;

    const session = await getOrCreateChatSession({
      scope: 'MASTER',
      forceNew: bound?.forceNewOnFirstMessage === true,
    });
    setSessions((prev) =>
      prev.map((s) =>
        s.id === localSessionId
          ? {
              ...s,
              serverSessionId: session.sessionId,
              forceNewOnFirstMessage: false,
            }
          : s
      )
    );
    return session.sessionId;
  };

  /* Bộ hẹn giờ của nút sao chép. Khai báo cạnh `abortRef` để hiệu ứng dọn dẹp
     bên dưới nhìn thấy cả hai ở cùng một chỗ. */
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);""",
'ensureServerSession')

# 3. handleNewSession: bat co
s = sub(s, """      // Chưa gắn phiên máy chủ. Lần gửi tin đầu tiên sẽ tạo phiên MỚI
      // (forceNew) thay vì dùng lại phiên MASTER đang mở — nếu không, "Hội
      // thoại mới" chỉ mới ở phía trình duyệt còn mô hình vẫn nhớ chuyện cũ.
      serverSessionId: null,""",
"""      // Chưa gắn phiên máy chủ. Lần gửi tin đầu tiên sẽ tạo phiên MỚI thay vì
      // dùng lại phiên MASTER đang mở — nếu không, "Hội thoại mới" chỉ mới ở
      // phía trình duyệt còn mô hình vẫn nhớ nguyên chuyện cũ.
      serverSessionId: null,
      forceNewOnFirstMessage: true,""", 'handleNewSession flag')

# 4. noi goi
s = sub(s, """      /* Hội thoại chưa gắn phiên máy chủ => đây là hội thoại vừa tạo bằng nút
         "Hội thoại mới", nên yêu cầu backend tạo phiên MỚI thay vì dùng lại. */
      const isFreshLocalSession = !activeSession.serverSessionId;
      const sessionId = await ensureServerSession(
        activeSession.id,
        isFreshLocalSession
      );

      abortRef.current?.abort();
      abortRef.current = new AbortController();
""",
"""      const sessionId = await ensureServerSession(activeSession.id);

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
""", 'noi goi ensureServerSession')
s = sub(s, "      }, abortRef.current.signal);", "      }, controller.signal);", 'signal')

# 5. bo khai bao copyTimerRef trung o duoi
s = sub(s, """  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyToClipboard = (text: string, id: string) => {""",
"""  const copyToClipboard = (text: string, id: string) => {""", 'copyTimerRef trung')

write(p, s)
print('AiMasterChat.tsx OK')
