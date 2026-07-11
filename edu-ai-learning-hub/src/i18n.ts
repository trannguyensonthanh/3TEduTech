// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  // Plugin để tải bản dịch từ server/public folder
  .use(HttpBackend)
  // Plugin để tự động phát hiện ngôn ngữ người dùng
  .use(LanguageDetector)
  // Plugin để kết nối i18next với react
  .use(initReactI18next)
  .init({
    // Ngôn ngữ mặc định nếu không phát hiện được ngôn ngữ nào khác
    fallbackLng: 'en',
    // Các ngôn ngữ được hỗ trợ
    supportedLngs: ['en', 'vi'],
    debug: process.env.NODE_ENV === 'development', // Bật debug mode ở môi trường dev

    // Cấu hình cho LanguageDetector
    detection: {
      // Thứ tự phát hiện ngôn ngữ:
      // 1. localStorage: Nếu người dùng đã từng chọn ngôn ngữ
      // 2. navigator: Ngôn ngữ của trình duyệt
      order: ['localStorage', 'navigator'],
      // Key để lưu ngôn ngữ trong localStorage
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    // Cấu hình cho HttpBackend (để tải file JSON)
    backend: {
      // Đường dẫn đến thư mục chứa file ngôn ngữ
      // {{lng}} sẽ được thay bằng mã ngôn ngữ (en, vi)
      // {{ns}} sẽ được thay bằng namespace (translation)
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Namespace mặc định
    ns: 'translation',
    defaultNS: 'translation',

    interpolation: {
      escapeValue: false, // React đã tự chống XSS
    },

    // Cấu hình cho react-i18next
    react: {
      useSuspense: true, // Sử dụng Suspense của React để xử lý loading
    },
  });

export default i18n;
