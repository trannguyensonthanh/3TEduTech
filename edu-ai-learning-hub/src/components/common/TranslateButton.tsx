// src/components/common/TranslateButton.tsx
import React from 'react';
import { useAutoTranslate } from '@/hooks/queries/translation.queries';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from './Icons';
import { toast } from 'sonner';

interface TranslateButtonProps {
  sourceText: string | null | undefined;
  // Ngôn ngữ gốc của văn bản, để biết nên dịch sang ngôn ngữ nào
  sourceLang: 'vi' | 'en';
  onTranslated: (translatedText: string, targetLang: 'vi' | 'en') => void;
  className?: string;
}

export const TranslateButton: React.FC<TranslateButtonProps> = ({
  sourceText,
  sourceLang,
  onTranslated,
  className,
}) => {
  const { mutate, isPending } = useAutoTranslate();

  const handleTranslate = (targetLang: 'vi' | 'en') => {
    // Không dịch nếu ngôn ngữ nguồn và đích giống nhau hoặc không có text
    if (targetLang === sourceLang || !sourceText || !sourceText.trim()) {
      if (!sourceText || !sourceText.trim()) {
        toast.info("There's nothing to translate.");
      }
      return;
    }

    mutate(
      { text: sourceText, sourceLang, targetLang },
      {
        onSuccess: (data) => {
          onTranslated(data.translatedText, targetLang);
          toast.success(
            `Content translated to ${targetLang === 'vi' ? 'Vietnamese' : 'English'}!`
          );
        },
        onError: (error) => {
          toast.error(error.message || 'Translation failed.');
        },
      }
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          disabled={isPending || !sourceText}
          className={className}
          aria-label='Translate content'
        >
          {isPending ? (
            <Icons.spinner className='h-4 w-4 animate-spin' />
          ) : (
            <Icons.languages className='h-4 w-4 text-muted-foreground' />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onClick={() => handleTranslate('en')}
          disabled={sourceLang === 'en' || isPending}
        >
          <Icons.languages className='mr-2 h-4 w-4' />
          <span>Translate to English</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleTranslate('vi')}
          disabled={sourceLang === 'vi' || isPending}
        >
          <Icons.languages className='mr-2 h-4 w-4' />
          <span>Translate to Vietnamese</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
