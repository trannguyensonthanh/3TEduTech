import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/common/Icons';
import { cn } from '@/lib/utils';
import { AvatarCanvas } from '@/components/ai-avatar/AvatarCanvas';

// Logic
import { useChatbot, ChatMessage } from '@/hooks/useChatbot';
import { queryCourseAI } from '@/services/ai.service';

interface AIAssistantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseContext: { courseName: string };
  lessonContext?: { lessonName: string };
}

const AIAssistantDialog: React.FC<AIAssistantDialogProps> = ({
  isOpen,
  onClose,
  courseContext,
  lessonContext,
}) => {
  const { t } = useTranslation();

  const welcomeText = lessonContext?.lessonName
    ? `I'm your AI assistant for the lesson "${lessonContext.lessonName}". How can I help?`
    : `I'm your AI assistant for the course "${courseContext.courseName}". Ask me anything!`;

  const initialMessage: ChatMessage = {
    id: 'init-1',
    sender: 'bot',
    text: welcomeText,
    suggestedQuestions: [
      'Summarize this lesson for me.',
      'What are the key takeaways?',
      "Explain this concept like I'm five.",
    ],
  };

  const { messages, isTyping, addUserMessage } = useChatbot({
    initialMessages: [initialMessage],
    queryFn: queryCourseAI,
    queryContext: { courseName: courseContext.courseName },
  });

  const [input, setInput] = useState('');
  const [voiceToPlay, setVoiceToPlay] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Khai báo ref cho div cuối

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.sender === 'bot' && lastMessage.voice) {
      setVoiceToPlay(lastMessage.voice);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isTyping || isSpeaking) return;
    addUserMessage(trimmedInput);
    setInput('');
  };

  const handleSuggestedQuestionClick = (question: string) => {
    if (isTyping || isSpeaking) return;
    setInput('');
    addUserMessage(question);
  };

  const lastBotMessage = messages
    .slice()
    .reverse()
    .find((m) => m.sender === 'bot');
  const suggestedQuestions = lastBotMessage?.suggestedQuestions || [];
  const currentAvatarAnimation = isTyping
    ? 'Thinking'
    : isSpeaking
      ? 'Talking'
      : 'Idle';

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className='max-w-4xl h-[90vh] max-h-[800px] w-[95vw] flex flex-col p-0 gap-0 shadow-2xl rounded-xl overflow-hidden motion-safe:animate-dialog-in'>
            <DialogHeader className='p-4 border-b flex flex-row justify-between items-center shrink-0'>
              <div className='flex items-center gap-3'>
                <Icons.bot className='h-6 w-6 text-primary' />
                <DialogTitle className='text-lg font-semibold'>
                  AI Course Assistant
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className='flex-1 flex flex-col md:flex-row overflow-hidden min-h-0'>
              {/* 3D Avatar */}
              <div className='w-full md:w-2/5 lg:w-2/5 h-1/3 md:h-full bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900 relative'>
                <AvatarCanvas
                  voiceData={voiceToPlay}
                  onSpeakingStateChange={setIsSpeaking}
                  externalAnimation={currentAvatarAnimation}
                />
                <div className='absolute bottom-2 left-2 right-2 text-center p-1.5 bg-black/40 rounded backdrop-blur-sm'>
                  <p className='text-xs text-slate-200 font-medium capitalize'>
                    {currentAvatarAnimation}...
                  </p>
                </div>
              </div>

              {/* Chat Interface */}
              <div className='flex-1 flex flex-col bg-background min-h-0'>
                <ScrollArea className='flex-grow p-4'>
                  <div className='space-y-5'>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'flex items-start gap-2.5 max-w-[85%]',
                          msg.sender === 'user'
                            ? 'ml-auto flex-row-reverse'
                            : 'mr-auto'
                        )}
                      >
                        {msg.sender === 'bot' && (
                          <div className='p-1.5 bg-primary/20 rounded-full shrink-0 mt-1'>
                            <Icons.bot className='h-5 w-5 text-primary' />
                          </div>
                        )}
                        <div
                          className={cn(
                            'p-3 rounded-xl text-sm prose prose-sm dark:prose-invert max-w-full break-words shadow-sm',
                            msg.sender === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-none'
                              : 'bg-muted text-card-foreground rounded-bl-none'
                          )}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className='flex items-start gap-2.5'
                      >
                        <div className='p-1.5 bg-primary/20 rounded-full shrink-0 mt-1'>
                          <Icons.bot className='h-5 w-5 text-primary' />
                        </div>
                        <div className='p-3 rounded-lg bg-muted shadow-sm'>
                          <div className='flex space-x-1.5 items-center h-4'>
                            <div className='w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]'></div>
                            <div className='w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]'></div>
                            <div className='w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce'></div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    {!isTyping && suggestedQuestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='pt-2 flex flex-wrap gap-2 justify-start md:ml-12'
                      >
                        {suggestedQuestions.map((q, i) => (
                          <Button
                            key={i}
                            variant='outline'
                            size='sm'
                            className='text-xs h-auto py-1 px-2.5'
                            onClick={() => handleSuggestedQuestionClick(q)}
                          >
                            {q}
                          </Button>
                        ))}
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className='p-3 border-t'>
                  <div className='relative'>
                    <Textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder='Ask anything about this lesson...'
                      className='pr-12 resize-none text-sm min-h-[44px] max-h-[120px] rounded-full py-2.5 px-4'
                      rows={1}
                      disabled={isTyping || isSpeaking}
                    />
                    <Button
                      type='submit'
                      size='icon'
                      variant='ghost'
                      className='absolute right-1.5 bottom-1.5 h-9 w-9 rounded-full text-primary hover:bg-primary/10 disabled:opacity-50'
                      disabled={!input.trim() || isTyping || isSpeaking}
                    >
                      <Icons.sendHorizonal size={20} />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default AIAssistantDialog;
