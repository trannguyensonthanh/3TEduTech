import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SkillsTable from '@/components/admin/skills/SkillsTable';
import SkillDialog from '@/components/admin/skills/SkillDialog';
import DeleteSkillDialog from '@/components/admin/skills/DeleteSkillDialog';
import PaginationControls from '@/components/admin/PaginationControls';
import {
  useCreateSkill,
  useDeleteSkill,
  useSkills,
  useUpdateSkill,
} from '@/hooks/queries/skill.queries';
import { Skill } from '@/services/skill.service';

const SkillsManagement: React.FC = () => {
  const { toast } = useToast();

  // Quản lý tham số truy vấn
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sử dụng hook useSkills để lấy dữ liệu từ API
  const { data, isLoading, isError, refetch } = useSkills({
    page: currentPage,
    limit: itemsPerPage,
    searchTerm: searchTerm,
  });

  const skills = data?.skills || [];
  const totalPages = data?.totalPages || 1;

  // Quản lý trạng thái dialog
  const [skillToEdit, setSkillToEdit] = useState<Skill | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Sử dụng các mutation hooks
  const createSkillMutation = useCreateSkill({
    onSuccess: () => {
      toast({
        title: 'Skill added',
        description: 'The skill has been added successfully.',
      });
      refetch(); // Làm mới danh sách kỹ năng
      setIsAddEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add skill.',
        variant: 'destructive',
      });
    },
  });

  const updateSkillMutation = useUpdateSkill({
    onSuccess: () => {
      toast({
        title: 'Skill updated',
        description: 'The skill has been updated successfully.',
      });
      refetch(); // Làm mới danh sách kỹ năng
      setIsAddEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update skill.',
        variant: 'destructive',
      });
    },
  });

  const deleteSkillMutation = useDeleteSkill({
    onSuccess: () => {
      toast({
        title: 'Skill deleted',
        description: 'The skill has been deleted successfully.',
        variant: 'destructive',
      });
      refetch(); // Làm mới danh sách kỹ năng
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete skill.',
        variant: 'destructive',
      });
    },
  });

  const handleAddSkill = () => {
    setSkillToEdit(null);
    setIsAddEditDialogOpen(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setSkillToEdit(skill);
    setIsAddEditDialogOpen(true);
  };

  const handleDeleteSkill = (skillId: number) => {
    const skill = skills.find((s) => s.skillId === skillId);
    if (skill) {
      setSkillToDelete(skill);
      setIsDeleteDialogOpen(true);
    }
  };

  // Xử lý submit thêm hoặc chỉnh sửa kỹ năng
  const handleSubmitSkill = async (data: {
    skillName: string;
    description: string | null;
  }) => {
    if (skillToEdit) {
      // Cập nhật kỹ năng
      updateSkillMutation.mutate({
        skillId: skillToEdit.skillId,
        data: {
          skillName: data.skillName,
          description: data.description,
        },
      });
    } else {
      // Thêm kỹ năng mới
      createSkillMutation.mutate({
        skillName: data.skillName,
        description: data.description,
      });
    }
  };

  // Xử lý xác nhận xóa kỹ năng
  const handleConfirmDelete = async () => {
    if (skillToDelete) {
      deleteSkillMutation.mutate(skillToDelete.skillId);
    }
  };

  return (
    <AdminLayout>
      <div className='container mx-auto py-6 space-y-6'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold text-primary dark:text-primary-light'>
            Skills Management
          </h1>
          <Button
            onClick={handleAddSkill}
            className='bg-primary hover:bg-primary/90 dark:bg-primary-light dark:hover:bg-primary-light/90'
          >
            <Plus className='mr-2 h-4 w-4' />
            Add Skill
          </Button>
        </div>

        <Card className='border-t-4 border-t-primary shadow-md dark:border-t-primary-light dark:shadow-none'>
          <CardContent className='p-6'>
            <div className='space-y-6'>
              <div className='relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground dark:text-muted-foreground-light' />
                <Input
                  type='search'
                  placeholder='Search skills...'
                  className='pl-8 border-gray-300 focus:border-primary focus:ring-primary dark:border-gray-700 dark:focus:border-primary-light dark:focus:ring-primary-light'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className='bg-white dark:bg-gray-800 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700'>
                <SkillsTable
                  skills={skills}
                  onEdit={handleEditSkill}
                  onDelete={handleDeleteSkill}
                />
              </div>

              {totalPages > 1 && (
                <div className='flex justify-center mt-6'>
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <SkillDialog
        open={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        skill={skillToEdit}
        onSubmit={handleSubmitSkill}
      />

      {skillToDelete && (
        <DeleteSkillDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          skillName={skillToDelete.skillName}
        />
      )}
    </AdminLayout>
  );
};

export default SkillsManagement;
