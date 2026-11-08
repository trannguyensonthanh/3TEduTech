import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import AppRouter from './router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SettingsProvider } from './contexts/SettingsContext';
import { Suspense } from 'react';
import { GlobalLoader } from '@/components/common/GlobalLoader';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import ErrorBoundary from '@/components/common/ErrorBoundary';

/* [SỬA] Trước đây là `new QueryClient()` trần, tức retry: 3 mặc định — mọi lỗi
   4xx (kể cả 403/404, vốn không bao giờ tự khỏi) đều bị thử lại 3 lần kèm
   backoff. Nay chỉ thử lại lỗi mạng/5xx. */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number })?.status;
        if (typeof status === 'number' && status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
const PAYPAL_CLIENT_ID =
  'AdhrvPtWEN-U1x8IuOIAWDQSvlW1D4mlGEKNR_9opv3rWs2FO0vznvK62Z5z2ZZkLPr0F-Rii3X-Z1Ki';
const initialOptions = {
  clientId: PAYPAL_CLIENT_ID,
  currency: 'USD', // Chỉ định tiền tệ
  intent: 'capture', // "capture" để lấy tiền ngay, "authorize" để chỉ giữ tiền
};
const App = () => {
  return (
    <Suspense
      fallback={<GlobalLoader fullscreen message='Loading Application...' />}
    >
      <QueryClientProvider client={queryClient}>
        <PayPalScriptProvider options={initialOptions}>
          <AuthProvider>
            <TooltipProvider>
              <ThemeProvider>
                <NotificationProvider>
                  <SettingsProvider>
                    <Toaster />
                    <Sonner />
                    <ErrorBoundary>
                      <AppRouter />
                    </ErrorBoundary>
                  </SettingsProvider>
                </NotificationProvider>
              </ThemeProvider>
            </TooltipProvider>
          </AuthProvider>
        </PayPalScriptProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Suspense>
  );
};

export default App;
