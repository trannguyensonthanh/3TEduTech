// src/pages/AiMasterChat.tsx
import React from 'react';
import Layout from '@/components/layout/Layout';
import AiMasterChatUI from '@/components/chatbot/AiMasterChatUI';

const AiMasterChat: React.FC = () => {
  return (
    <Layout hideFooter={true} fullScreen={true}>
      <AiMasterChatUI layoutMode="full" />
    </Layout>
  );
};

export default AiMasterChat;
