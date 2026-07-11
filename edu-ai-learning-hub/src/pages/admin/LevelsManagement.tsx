/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LevelsTable from '@/components/admin/levels/LevelsTable';
import LevelDialog from '@/components/admin/levels/LevelDialog';
import DeleteLevelDialog from '@/components/admin/levels/DeleteLevelDialog';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useToast } from '@/components/ui/use-toast';
import {
  useCreateLevel,
  useDeleteLevel,
  useLevels,
  useUpdateLevel,
} from '@/hooks/queries/level.queries';
import { Level } from '@/services/level.service';
import PaginationControls from '@/components/admin/PaginationControls';

const LevelsManagement = () => {
  const { toast } = useToast();

  // Quản lý trạng thái
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sử dụng hook useLevels để lấy danh sách cấp độ
  const { data, isLoading, isError, refetch } = useLevels();
  const levels = data?.levels || [];
  const totalPages = Math.ceil(levels.length / itemsPerPage);

  // Sử dụng các mutation hooks
  const createLevelMutation = useCreateLevel({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Level created successfully.',
      });
      refetch(); // Làm mới danh sách cấp độ
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create level.',
        variant: 'destructive',
      });
    },
  });

  const updateLevelMutation = useUpdateLevel({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Level updated successfully.',
      });
      refetch(); // Làm mới danh sách cấp độ
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update level.',
        variant: 'destructive',
      });
    },
  });

  const deleteLevelMutation = useDeleteLevel({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Level deleted successfully.',
      });
      refetch(); // Làm mới danh sách cấp độ
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete level.',
        variant: 'destructive',
      });
    },
  });

  // Xử lý thêm cấp độ
  const handleAddLevel = (data: { name: string }) => {
    createLevelMutation.mutate({ levelName: data.name });
  };

  // Xử lý cập nhật cấp độ
  const handleUpdateLevel = (data: { name: string }) => {
    if (selectedLevel) {
      updateLevelMutation.mutate({
        levelId: selectedLevel.LevelID,
        data: { levelName: data.name },
      });
    }
  };

  // Xử lý xóa cấp độ
  const handleDeleteLevel = () => {
    if (levelToDelete) {
      deleteLevelMutation.mutate(levelToDelete);
    }
  };

  // Xử lý mở dialog chỉnh sửa
  const handleEditLevel = (level: Level) => {
    setSelectedLevel(level);
    setIsAddDialogOpen(true);
  };

  // Xử lý mở dialog xóa
  const handleDeleteClick = (level: any) => {
    setLevelToDelete(level);
    setIsDeleteDialogOpen(true);
  };

  // Phân trang
  const paginatedLevels = levels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AdminLayout>
      <div className='space-y-6'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold tracking-tight'>
            Levels Management
          </h1>
          <Button
            onClick={() => {
              setSelectedLevel(null);
              setIsAddDialogOpen(true);
            }}
            className='flex items-center gap-1'
          >
            <Plus className='h-4 w-4' /> Add Level
          </Button>
        </div>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle>Course Levels</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='py-10 text-center text-muted-foreground'>
                Loading levels...
              </div>
            ) : (
              <>
                <LevelsTable
                  levels={paginatedLevels}
                  onEdit={handleEditLevel}
                  onDelete={handleDeleteClick}
                />
                {totalPages > 1 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <LevelDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        level={selectedLevel}
        onSubmit={selectedLevel ? handleUpdateLevel : handleAddLevel}
      />

      <DeleteLevelDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteLevel}
        levelName={levelToDelete?.name || ''}
      />
    </AdminLayout>
  );
};

export default LevelsManagement;
