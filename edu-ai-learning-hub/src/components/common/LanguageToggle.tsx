// src/components/common/LanguageToggle.tsx
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from './Icons';

export function LanguageToggle() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: 'en' | 'vi') => {
    i18n.changeLanguage(lng).then(() => {
      window.location.reload();
    });
  };

  const currentLanguage = i18n.language;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon'>
          <Icons.languages className='h-[1.2rem] w-[1.2rem]' />
          <span className='sr-only'>{t('languageToggle.toggle')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          disabled={currentLanguage === 'en'}
        >
          {t('languageToggle.en')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('vi')}
          disabled={currentLanguage.startsWith('vi')}
        >
          {t('languageToggle.vi')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
