// src/contexts/SettingsContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

const supportedCurrencies = z.enum(['VND', 'USD']);
const supportedLanguages = z.enum(['vi', 'en']);

type Currency = z.infer<typeof supportedCurrencies>;
type Language = z.infer<typeof supportedLanguages>;

interface SettingsContextType {
  language: Language;
  currency: Currency;
  setLanguage: (language: Language) => void;
  formatPrice: (price: number) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

interface SettingsProviderProps {
  children: ReactNode;
}
const CURRENCY_STORAGE_KEY = 'app-currency';
export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const { i18n } = useTranslation();

  // Hàm khởi tạo state, đọc từ localStorage hoặc i18next một lần duy nhất
  const getInitialLanguage = (): Language => {
    return (i18n.language?.startsWith('vi') ? 'vi' : 'en') as Language;
  };

  const getInitialCurrency = (): Currency => {
    const savedCurrency = localStorage.getItem(
      CURRENCY_STORAGE_KEY
    ) as Currency;
    if (savedCurrency && ['VND', 'USD'].includes(savedCurrency)) {
      return savedCurrency;
    }
    // Nếu không có, mặc định theo ngôn ngữ
    const lang = getInitialLanguage();
    return lang === 'vi' ? 'VND' : 'USD';
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [currency, setCurrencyState] = useState<Currency>(getInitialCurrency);

  // Hàm private để set currency và lưu vào storage
  const updateCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
  };

  const setLanguage = useCallback(
    (lang: Language) => {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
      // Logic cập nhật tiền tệ vẫn giữ nguyên nhưng gọi qua hàm helper
      const newCurrency = lang === 'vi' ? 'VND' : 'USD';
      updateCurrency(newCurrency);
    },
    [i18n]
  );

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      const newLang = (lng.startsWith('vi') ? 'vi' : 'en') as Language;
      setLanguageState(newLang);

      const newCurrency = newLang === 'vi' ? 'VND' : 'USD';
      // Gọi qua hàm helper để đảm bảo lưu vào localStorage
      updateCurrency(newCurrency);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const formatPrice = useCallback(
    (price: number): string => {
      try {
        return new Intl.NumberFormat(language, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: currency === 'VND' ? 0 : 2,
          maximumFractionDigits: currency === 'VND' ? 0 : 2,
        }).format(price);
      } catch (e) {
        if (currency === 'VND') {
          return `${price.toLocaleString('vi-VN')} ₫`;
        }
        return `$${price.toFixed(2)}`;
      }
    },
    [language, currency]
  );

  const value = { language, currency, setLanguage, formatPrice };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
