/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Level } from '@/services/level.service';
import { useTranslation } from 'react-i18next';

interface LevelsTableProps {
  levels: Level[];
  onEdit: (level: Level) => void;
  onDelete: (levelId: any) => void;
}

const LevelsTable: React.FC<LevelsTableProps> = ({
  levels,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  return (
    <Table>
      <TableHeader>
        <TableRow className='bg-muted/50'>
          <TableHead className='w-12 font-semibold'>
            {t('levelsTable.headers.id')}
          </TableHead>
          <TableHead className='font-semibold'>
            {t('levelsTable.headers.levelName')}
          </TableHead>
          <TableHead className='font-semibold'>
            {t('levelsTable.headers.createdAt')}
          </TableHead>
          <TableHead className='font-semibold'>
            {t('levelsTable.headers.updatedAt')}
          </TableHead>
          <TableHead className='text-right font-semibold'>
            {t('levelsTable.headers.actions')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {levels.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className='text-center py-8 text-muted-foreground'
            >
              {t('levelsTable.noLevels')}
            </TableCell>
          </TableRow>
        ) : (
          levels.map((level) => (
            <TableRow
              key={level.levelId}
              className='hover:bg-muted/30 transition-colors'
            >
              <TableCell>{level.levelId}</TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant='outline'
                    className='bg-primary/10 text-primary border-primary/20'
                  >
                    {level.levelName}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>{formatDate(level.createdAt)}</TableCell>
              <TableCell>{formatDate(level.updatedAt)}</TableCell>
              <TableCell className='text-right space-x-2'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onEdit(level)}
                  className='text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                >
                  <Edit className='h-4 w-4' />
                  <span className='sr-only'>{t('levelsTable.edit')}</span>
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onDelete(level.levelId)}
                  className='text-red-600 hover:text-red-800 hover:bg-red-50'
                >
                  <Trash className='h-4 w-4' />
                  <span className='sr-only'>{t('levelsTable.delete')}</span>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default LevelsTable;
