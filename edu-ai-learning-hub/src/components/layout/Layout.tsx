import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import ChatbotUI from '../chatbot/ChatbotUI';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  fullScreen?: boolean;
}

const Layout = ({ children, hideFooter = false, fullScreen = false }: LayoutProps) => {
  return (
    <div className={`flex flex-col ${fullScreen ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Navbar />
      <main className={`flex-grow flex flex-col ${fullScreen ? 'min-h-0 overflow-hidden' : ''}`}>
        {children}
      </main>
      {!hideFooter && <Footer />}
      <ChatbotUI />
    </div>
  );
};

export default Layout;
