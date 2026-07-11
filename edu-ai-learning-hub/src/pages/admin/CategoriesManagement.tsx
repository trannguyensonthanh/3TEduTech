import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/common/Icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import PaginationControls from '@/components/admin/PaginationControls';
import { Category } from '@/services/category.service';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/queries/category.queries';

// Mock categories data - in a real application, this would come from an API
const categoriesData = [
  {
    id: 1,
    name: 'Programming',
    coursesCount: 42,
    slug: 'programming',
    icon: '💻',
    featured: true,
    createdAt: '2023-01-15',
  },
  {
    id: 2,
    name: 'Design',
    coursesCount: 38,
    slug: 'design',
    icon: '🎨',
    featured: true,
    createdAt: '2023-01-20',
  },
  {
    id: 3,
    name: 'Business',
    coursesCount: 29,
    slug: 'business',
    icon: '💼',
    featured: false,
    createdAt: '2023-01-25',
  },
  {
    id: 4,
    name: 'Marketing',
    coursesCount: 25,
    slug: 'marketing',
    icon: '📊',
    featured: true,
    createdAt: '2023-02-05',
  },
  {
    id: 5,
    name: 'Photography',
    coursesCount: 18,
    slug: 'photography',
    icon: '📷',
    featured: false,
    createdAt: '2023-02-10',
  },
  {
    id: 6,
    name: 'Music',
    coursesCount: 15,
    slug: 'music',
    icon: '🎵',
    featured: false,
    createdAt: '2023-02-18',
  },
  {
    id: 7,
    name: 'Health & Fitness',
    coursesCount: 22,
    slug: 'health-fitness',
    icon: '💪',
    featured: false,
    createdAt: '2023-03-01',
  },
  {
    id: 8,
    name: 'Language',
    coursesCount: 31,
    slug: 'language',
    icon: '🗣️',
    featured: true,
    createdAt: '2023-03-12',
  },
  {
    id: 9,
    name: 'Science',
    coursesCount: 27,
    slug: 'science',
    icon: '🔬',
    featured: false,
    createdAt: '2023-03-25',
  },
  {
    id: 10,
    name: 'Personal Development',
    coursesCount: 24,
    slug: 'personal-development',
    icon: '🧠',
    featured: true,
    createdAt: '2023-04-05',
  },
  {
    id: 11,
    name: 'Finance',
    coursesCount: 19,
    slug: 'finance',
    icon: '💰',
    featured: false,
    createdAt: '2023-04-15',
  },
  {
    id: 12,
    name: '3D & Animation',
    coursesCount: 11,
    slug: '3d-animation',
    icon: '🎮',
    featured: false,
    createdAt: '2023-04-22',
  },
];

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

const categorySchema = z.object({
  categoryName: z.string().min(1, 'Category name is required'),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  iconUrl: z.string().nullable().optional(),
});

const CategoriesManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sử dụng hook useCategories để lấy dữ liệu từ API
  const { data, isLoading, isError, refetch } = useCategories({
    page: currentPage,
    limit: itemsPerPage,
    searchTerm: searchQuery,
  });

  const categories = data?.categories || [];
  const totalPages = data?.totalPages || 1;
  console.log('Categories:', categories);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>(null);
  const addForm = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      categoryName: '',
      slug: '',
      iconUrl: '',
      description: null,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      categoryName: selectedCategory?.categoryName || '',
      slug: selectedCategory?.slug || '',
      iconUrl: selectedCategory?.iconUrl || '',
      description: selectedCategory?.description || null,
    },
  });
  // Sử dụng các mutation hooks
  const createCategoryMutation = useCreateCategory({
    onSuccess: () => {
      refetch(); // Refresh the category list
      setIsAddDialogOpen(false);
      toast.success('Category created successfully.');
    },
    onError: (error) => {
      console.error('Failed to create category:', error.message);
    },
  });

  const updateCategoryMutation = useUpdateCategory({
    onSuccess: () => {
      refetch(); // Refresh the category list
      setIsEditDialogOpen(false);
      toast.success('Category updated successfully.');
    },
    onError: (error) => {
      console.error('Failed to update category:', error.message);
    },
  });

  const deleteCategoryMutation = useDeleteCategory({
    onSuccess: () => {
      refetch(); // Refresh the category list
      toast.success('Category deleted successfully.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete category.');
    },
  });

  const handleAddCategory = (data: {
    categoryName: string;
    slug?: string;
    iconUrl?: string;
    description?: string | null;
  }) => {
    createCategoryMutation.mutate(data);
  };

  const handleUpdateCategory = (data: {
    categoryName?: string;
    slug?: string;
    iconUrl?: string;
    description?: string | null;
  }) => {
    console.log('Updating category with data:', data);
    if (selectedCategory) {
      updateCategoryMutation.mutate({
        categoryId: selectedCategory.categoryId,
        data,
      });
    }
  };

  // Xử lý xóa danh mục
  const handleDeleteCategory = (categoryId: number) => {
    deleteCategoryMutation.mutate(categoryId);
  };

  // Xử lý mở dialog chỉnh sửa
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
    editForm.reset({
      categoryName: category.categoryName,
      slug: category.slug,
      iconUrl: category.iconUrl,
      description: category.description,
    });
  };

  return (
    <AdminLayout>
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <h1 className='text-3xl font-bold tracking-tight'>
            Categories Management
          </h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Icons.plus className='mr-2 h-4 w-4' />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new category for courses. Categories help students
                  find relevant content.
                </DialogDescription>
              </DialogHeader>

              <Form {...addForm}>
                <form
                  onSubmit={addForm.handleSubmit((data) =>
                    handleAddCategory(data)
                  )}
                  className='grid gap-4 py-4'
                >
                  <FormField
                    control={addForm.control}
                    name='categoryName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g., Web Development'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name='slug'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g., web-development'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addForm.control}
                    name='iconUrl'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Icon (Emoji URL)</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g., 💻' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name='description'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder='abc' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type='submit'>Create Category</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update the details for this category.
                </DialogDescription>
              </DialogHeader>

              {selectedCategory && (
                <Form {...editForm}>
                  <form
                    onSubmit={editForm.handleSubmit((data) =>
                      handleUpdateCategory(data)
                    )}
                    className='grid gap-4 py-4'
                  >
                    <FormField
                      control={editForm.control}
                      name='categoryName'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='e.g., Web Development'
                              {...field}
                              defaultValue={selectedCategory.categoryName}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name='slug'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='e.g., web-development'
                              {...field}
                              defaultValue={selectedCategory.slug}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name='iconUrl'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icon (Emoji URL)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='e.g., 💻'
                              {...field}
                              defaultValue={selectedCategory.iconUrl}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addForm.control}
                      name='description'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='abc'
                              {...field}
                              defaultValue={selectedCategory.description}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        variant='outline'
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type='submit'>Save Changes</Button>
                    </DialogFooter>
                  </form>
                </Form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className='flex gap-4 items-center'>
          <div className='relative flex-1'>
            <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search categories...'
              className='pl-10'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className='border rounded-md overflow-hidden'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[50px]'>Icon</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className='text-center'>Courses</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center'>
                    Loading...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center'>
                    Error loading categories.
                  </TableCell>
                </TableRow>
              ) : categories.length > 0 ? (
                categories.map((category) => (
                  <TableRow key={category.categoryId}>
                    <TableCell className='text-center text-xl'>
                      <img
                        src={
                          category.iconUrl || 'https://i.imgur.com/Fv9X0sX.jpeg'
                        }
                        alt={category.categoryName}
                        className='inline-block h-6 w-6'
                      />
                    </TableCell>
                    <TableCell className='font-medium'>
                      {category.categoryName}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {category.slug || '-'}
                    </TableCell>
                    <TableCell className='text-center'>
                      {/* {category?.coursesCount || 0} */}0
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(category.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {category.updatedAt
                        ? new Date(category.updatedAt).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleEditCategory(category)}
                        >
                          <Icons.edit className='h-4 w-4' />
                          <span className='sr-only'>Edit</span>
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() =>
                            handleDeleteCategory(category.categoryId)
                          }
                        >
                          <Icons.trash className='h-4 w-4' />
                          <span className='sr-only'>Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center'>
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default CategoriesManagement;
