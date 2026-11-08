import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Lưới an toàn cho toàn bộ ứng dụng.
 *
 * Vì sao cần: trước bản này cây component KHÔNG có ErrorBoundary nào (chỉ có
 * WebGLErrorBoundary dùng riêng cho phần giới thiệu 3D). Bất kỳ ngoại lệ nào
 * phát sinh trong giai đoạn render đều làm React gỡ bỏ toàn bộ cây — người dùng
 * nhận một TRANG TRẮNG hoàn toàn, không thông báo, không cách nào thoát ra.
 *
 * Dự án có sẵn vài nguồn gây lỗi kiểu này: `strictNullChecks` đang tắt nên
 * nhiều chỗ truy cập thuộc tính lồng nhau mà không kiểm tra (ví dụ
 * `course.pricing.display` chạy trước cả guard `!course`), và dữ liệu hỏng
 * trong localStorage từng làm hỏng ProtectedRoute.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Lỗi không bắt được trong cây React:', error, errorInfo);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    const { error } = this.state;
    const { children } = this.props;

    if (!error) {
      return children;
    }

    return (
      <div className='flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center'>
        <h1 className='text-2xl font-semibold'>Đã xảy ra lỗi</h1>
        <p className='max-w-md text-muted-foreground'>
          Trang này gặp sự cố không mong muốn. Bạn có thể quay về trang chủ và
          thử lại.
        </p>
        {import.meta.env.DEV && (
          <pre className='max-w-full overflow-auto rounded bg-muted p-3 text-left text-xs'>
            {error.message}
          </pre>
        )}
        <Button onClick={this.handleReload}>Về trang chủ</Button>
      </div>
    );
  }
}

export default ErrorBoundary;
