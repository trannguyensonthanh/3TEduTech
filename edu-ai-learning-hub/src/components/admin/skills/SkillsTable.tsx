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
import { Skill } from '@/services/skill.service';
import { useTranslation } from 'react-i18next';

interface SkillsTableProps {
  skills: Skill[];
  onEdit: (skill: Skill) => void;
  onDelete: (skillId: number) => void;
}

const SkillsTable: React.FC<SkillsTableProps> = ({
  skills,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  console.log('SkillsTable rendered with skills:', skills);
  return (
    <Table>
      <TableHeader>
        <TableRow className='bg-muted/50'>
          <TableHead className='w-12 font-semibold'>
            {t('skillsTable.headers.id')}
          </TableHead>
          <TableHead className='font-semibold'>
            {t('skillsTable.headers.skillName')}
          </TableHead>
          <TableHead className='font-semibold'>
            {t('skillsTable.headers.description')}
          </TableHead>
          <TableHead className='font-semibold'>
            {t('skillsTable.headers.createdAt')}
          </TableHead>
          <TableHead className='font-semibold'>
            {t('skillsTable.headers.updatedAt')}
          </TableHead>
          <TableHead className='text-right font-semibold'>
            {t('skillsTable.headers.actions')}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {skills.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className='text-center py-8 text-muted-foreground'
            >
              {t('skillsTable.noSkills')}
            </TableCell>
          </TableRow>
        ) : (
          skills.map((skill) => (
            <TableRow
              key={skill.skillId}
              className='hover:bg-muted/30 transition-colors'
            >
              <TableCell>{skill.skillId}</TableCell>
              <TableCell>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant='outline'
                    className='bg-primary/10 text-primary border-primary/20'
                  >
                    {skill.skillName}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className='max-w-md'>
                <div className='truncate'>
                  {skill.description || t('skillsTable.emptyDescription')}
                </div>
              </TableCell>
              <TableCell>{formatDate(skill.createdAt)}</TableCell>
              <TableCell>{formatDate(skill.updatedAt)}</TableCell>
              <TableCell className='text-right space-x-2'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onEdit(skill)}
                  className='text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                >
                  <Edit className='h-4 w-4' />
                  <span className='sr-only'>{t('skillsTable.edit')}</span>
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onDelete(skill.skillId)}
                  className='text-red-600 hover:text-red-800 hover:bg-red-50'
                >
                  <Trash className='h-4 w-4' />
                  <span className='sr-only'>{t('skillsTable.delete')}</span>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default SkillsTable;
