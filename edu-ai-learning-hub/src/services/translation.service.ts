// src/services/translation.service.ts

// API endpoint của MyMemory
const TRANSLATE_API_URL = 'https://api.mymemory.translated.net/get';

interface TranslatePayload {
  text: string;
  sourceLang: 'vi' | 'en';
  targetLang: 'vi' | 'en';
}

interface TranslateResponse {
  translatedText: string;
  source: string;
}

// Cấu trúc response trả về từ MyMemory
interface MyMemoryResponse {
  responseData: {
    translatedText: string;
    match: number;
  };
  responseStatus: number;
  responseDetails?: string;
}

export const autoTranslateText = async (
  payload: TranslatePayload
): Promise<TranslateResponse> => {
  const { text, sourceLang, targetLang } = payload;

  // Xây dựng URL với các query parameters
  const langPair = `${sourceLang}|${targetLang}`;
  const url = new URL(TRANSLATE_API_URL);
  url.searchParams.append('q', text);
  url.searchParams.append('langpair', langPair);
  // (Tùy chọn) Thêm email để nhận được nhiều request hơn nếu cần
  // url.searchParams.append('de', 'your-email@example.com');

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(
        `MyMemory API request failed with status ${response.status}`
      );
    }

    const data: MyMemoryResponse = await response.json();

    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || 'Translation failed.');
    }

    return {
      translatedText: data.responseData.translatedText,
      source: 'MyMemory API',
    };
  } catch (error) {
    console.error('Translation service error:', error);
    throw new Error('Could not connect to the translation service.');
  }
};
