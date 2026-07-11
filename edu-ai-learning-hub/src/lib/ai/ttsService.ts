/**
 * Hủy tất cả các tác vụ phát âm đang chờ hoặc đang diễn ra.
 */
export const cancelSpeech = (): void => {
  if ('speechSynthesis' in window) {
    console.log('TTS: Cancelling all speech synthesis utterances.');
    window.speechSynthesis.cancel();
  }
};

export const speakText = (
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (event: SpeechSynthesisErrorEvent) => void // Tham số thứ 4
): void => {
  if (!('speechSynthesis' in window)) {
    console.error('Trình duyệt này không hỗ trợ Web Speech API.');
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);

  // ----- CHỈ ĐỊNH GIỌNG TIẾNG VIỆT -----
  try {
    const voices = window.speechSynthesis.getVoices();
    console.log(
      'TTS: Checking available voices again:',
      voices.map((v) => ({ name: v.name, lang: v.lang, default: v.default }))
    ); // Log tên, lang, default

    let selectedVoice: SpeechSynthesisVoice | undefined = undefined;

    // 1. Ưu tiên tìm giọng có lang 'vi-VN' VÀ chứa 'Natural' trong tên (thường chất lượng cao)
    selectedVoice = voices.find(
      (voice) => voice.lang === 'vi-VN' && voice.name.includes('Natural')
    );

    // 2. Nếu không có 'Natural', tìm bất kỳ giọng 'vi-VN' nào
    if (!selectedVoice) {
      selectedVoice = voices.find((voice) => voice.lang === 'vi-VN');
    }

    // 3. Nếu vẫn không có vi-VN, dùng giọng mặc định của trình duyệt
    if (!selectedVoice) {
      selectedVoice = voices.find((voice) => voice.default);
      console.warn(
        'TTS: Không tìm thấy giọng vi-VN phù hợp. Sử dụng giọng mặc định hệ thống.'
      );
    }

    // 4. Nếu không có cả mặc định (rất hiếm), lấy giọng đầu tiên
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
      console.warn(
        'TTS: Không tìm thấy giọng vi-VN hoặc mặc định. Sử dụng giọng đầu tiên trong danh sách.'
      );
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      // Đặt lang dựa trên giọng đã chọn để đảm bảo khớp
      utterance.lang = selectedVoice.lang;
      console.log(
        `TTS: Using selected voice: "${selectedVoice.name}" (${selectedVoice.lang})`
      );
    } else {
      console.error('TTS: Không tìm thấy bất kỳ giọng nói nào!');
      // Không đặt lang nếu không có giọng nào
    }
  } catch (e) {
    console.error('TTS: Lỗi khi lấy/đặt giọng nói:', e);
  }

  // ... (pitch, rate, volume, callbacks, speak) ...
  utterance.pitch = 1;
  utterance.rate = 1;
  utterance.volume = 1;
  // 5. Gán các sự kiện callback
  utterance.onstart = () => {
    console.log('TTS: Bắt đầu nói...');
    onStart?.(); // Gọi callback onStart
  };

  utterance.onend = () => {
    console.log('TTS: Nói xong.');
    onEnd?.(); // Gọi callback onEnd
  };

  utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
    // Thêm type để lấy chi tiết
    console.error('TTS: Lỗi khi phát giọng nói!');
    console.error(' - Error Code:', event.error); // Mã lỗi (quan trọng!)
    console.error(' - Utterance Text:', event.utterance.text);
    console.error(' - Utterance Lang:', event.utterance.lang);
    console.error(
      ' - Utterance Voice:',
      event.utterance.voice ? event.utterance.voice.name : 'Default'
    );
    console.error(' - Event Object:', event); // Log toàn bộ event
    onEnd?.();
  };

  // 6. Thực hiện nói
  console.log('TTS: Yêu cầu nói:', text);
  window.speechSynthesis.speak(utterance);
};

// (Tùy chọn) Hàm lấy danh sách giọng nói có sẵn
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (!('speechSynthesis' in window)) {
    return [];
  }
  // Lưu ý: getVoices() đôi khi trả về danh sách rỗng lần đầu
  // Cần gọi nó sau sự kiện 'voiceschanged' hoặc trong một timeout nhỏ
  return window.speechSynthesis.getVoices();
};

// Giải thích ttsService.ts:
// speakText(text, onStart, onEnd): Hàm chính nhận text và 2 callback.
// Kiểm tra hỗ trợ: Đảm bảo speechSynthesis tồn tại trong window.
// window.speechSynthesis.cancel(): Dừng mọi phát âm đang diễn ra.
// new SpeechSynthesisUtterance(text): Tạo đối tượng chứa text và các cài đặt phát âm.
// Cấu hình (tùy chọn): Bạn có thể đặt ngôn ngữ (lang), chọn giọng (voice), tốc độ (rate), cao độ (pitch). Việc tìm giọng tiếng Việt (vi-VN) có thể không thành công trên mọi trình duyệt/hệ điều hành.
// Callbacks onstart, onend, onerror: Gán các hàm sẽ được gọi khi các sự kiện tương ứng xảy ra. Chúng ta dùng onStart để biết khi nào bắt đầu nói và onEnd để biết khi nào kết thúc (kể cả khi lỗi).
// window.speechSynthesis.speak(utterance): Bắt đầu quá trình phát âm.
// Gọi getVoices sớm để khởi tạo (có thể giúp ích)
if (
  'speechSynthesis' in window &&
  window.speechSynthesis.onvoiceschanged !== undefined
) {
  window.speechSynthesis.onvoiceschanged = () => {
    console.log('TTS Voices have changed/loaded.');
    // Có thể gọi getAvailableVoices() ở đây nếu cần cập nhật danh sách động
  };
}
// Gọi getVoices một lần để thử tải danh sách
window.speechSynthesis.getVoices();
