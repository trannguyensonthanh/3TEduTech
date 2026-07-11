// src/hooks/queries/translation.queries.ts
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { autoTranslateText } from '@/services/translation.service';

interface TranslatePayload {
  text: string;
  sourceLang: 'vi' | 'en';
  targetLang: 'vi' | 'en';
}

interface TranslateResponse {
  translatedText: string;
  source: string;
}

export const useAutoTranslate = (
  options?: UseMutationOptions<TranslateResponse, Error, TranslatePayload>
) => {
  return useMutation<TranslateResponse, Error, TranslatePayload>({
    mutationFn: autoTranslateText,
    ...options,
  });
};
