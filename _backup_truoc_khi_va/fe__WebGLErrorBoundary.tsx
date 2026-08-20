// src/components/common/WebGLErrorBoundary.tsx
import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onWebGLError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  isWebGLSupported: boolean;
}

/**
 * Kiểm tra nhanh khả năng hỗ trợ WebGL của trình duyệt và card đồ họa.
 */
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext('experimental-webgl');
    return !!(gl && gl instanceof WebGLRenderingContext);
  } catch (e) {
    return false;
  }
}

export class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isWebGLSupported: true,
    };
  }

  componentDidMount() {
    const supported = checkWebGLSupport();
    if (!supported) {
      console.warn('⚠️ WebGL is not supported or context is blocked by the browser.');
      this.setState({ isWebGLSupported: false });
    }

    // Lắng nghe sự kiện mất ngữ cảnh WebGL toàn cầu từ trình duyệt
    window.addEventListener('webglcontextlost', this.handleContextLost as EventListener, false);
  }

  componentWillUnmount() {
    window.removeEventListener('webglcontextlost', this.handleContextLost as EventListener, false);
  }

  handleContextLost = (e: Event) => {
    e.preventDefault();
    console.warn('⚠️ WebGL Context Lost detected! Switching to CSS fallback.');
    this.setState({ hasError: true });
  };

  static getDerivedStateFromError(error: Error): State {
    // Nhận diện lỗi ngữ cảnh Three.js / WebGL
    if (
      error.message &&
      (error.message.includes('WebGL') ||
        error.message.includes('context') ||
        error.message.includes('THREE.WebGLRenderer'))
    ) {
      return { hasError: true, isWebGLSupported: false };
    }
    // Dù là lỗi renderer nào trong Canvas cũng gỡ lỗi an toàn
    return { hasError: true, isWebGLSupported: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('🛡️ WebGLErrorBoundary intercepted a crash:', error.message, errorInfo.componentStack);
    if (this.props.onWebGLError) {
      this.props.onWebGLError(error);
    }
  }

  render() {
    if (this.state.hasError || !this.state.isWebGLSupported) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      // Mặc định trả về hiệu ứng Ambient Light Gradient bằng Vanilla CSS, siêu mượt và không bao giờ crash
      return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
        </div>
      );
    }

    return this.props.children;
  }
}
export default WebGLErrorBoundary;
