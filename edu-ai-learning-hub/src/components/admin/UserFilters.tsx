import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedRole: string | null;
  setSelectedRole: (value: string | null) => void;
  selectedStatus: string | null;
  setSelectedStatus: (value: string | null) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedRole,
  setSelectedRole,
  selectedStatus,
  setSelectedStatus,
}) => {
  const { t } = useTranslation();
  return (
    <div className='flex flex-col md:flex-row gap-4'>
      <div className='relative flex-1'>
        <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
        <Input
          type='search'
          placeholder={t('userFilters.searchPlaceholder')}
          className='pl-8'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Select
        value={selectedRole ?? 'all'}
        onValueChange={(value) =>
          setSelectedRole(value === 'all' ? null : value)
        }
      >
        <SelectTrigger className='w-[180px]'>
          <SelectValue placeholder={t('userFilters.filterByRole')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>{t('userFilters.allRoles')}</SelectItem>
          <SelectItem value='NU'>{t('userFilters.role.student')}</SelectItem>
          <SelectItem value='GV'>{t('userFilters.role.instructor')}</SelectItem>
          <SelectItem value='AD'>{t('userFilters.role.admin')}</SelectItem>
          <SelectItem value='SA'>{t('userFilters.role.superAdmin')}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={selectedStatus ?? 'all'}
        onValueChange={(value) =>
          setSelectedStatus(value === 'all' ? null : value)
        }
      >
        <SelectTrigger className='w-[180px]'>
          <SelectValue placeholder={t('userFilters.filterByStatus')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>{t('userFilters.allStatuses')}</SelectItem>
          <SelectItem value='ACTIVE'>
            {t('userFilters.status.active')}
          </SelectItem>
          <SelectItem value='INACTIVE'>
            {t('userFilters.status.inactive')}
          </SelectItem>
          <SelectItem value='BANNED'>
            {t('userFilters.status.banned')}
          </SelectItem>
          <SelectItem value='PENDING_VERIFICATION'>
            {t('userFilters.status.pendingVerification')}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserFilters;
