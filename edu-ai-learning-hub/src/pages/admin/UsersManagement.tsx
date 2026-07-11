/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';

import { UserPlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserViewDialog from '@/components/admin/UserViewDialog';
import UserEditDialog from '@/components/admin/UserEditDialog';
import PaginationControls from '@/components/admin/PaginationControls';
import AddUserDialog from '@/components/admin/AddUserDialog';
import UserTable from '@/components/admin/UserTable';
import UserFilters from '@/components/admin/UserFilters';
import { useAdminGetUsers } from '@/hooks/queries/user.queries';
import { UserProfile } from '@/services/user.service';

// Define types based on the provided database schema
type UserRole = 'NU' | 'GV' | 'AD' | 'SA';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'PENDING_VERIFICATION';
type Gender = 'MALE' | 'FEMALE' | null;

interface SocialLink {
  platform: string;
  url: string;
}

export interface User {
  AccountID: number;
  FullName: string;
  Email: string;
  RoleID: UserRole;
  Status: UserStatus;
  CreatedAt: string;
  UpdatedAt: string;
  AvatarUrl?: string | null;
  HasSocialLogin: boolean;
  courses?: number;
  gender?: Gender;
  birthDate?: string;
  phoneNumber?: string;
  location?: string;
  // Instructor fields
  professionalTitle?: string;
  bio?: string;
  aboutMe?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankAccountHolderName?: string;
  skills?: string[];
  socialLinks?: SocialLink[];
}

// Mock data for demonstration
// const mockUsers: User[] = Array.from({ length: 50 }).map((_, i) => ({
//   id: i + 1,
//   name: `User ${i + 1}`,
//   email: `user${i + 1}@example.com`,
//   role: ['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'][
//     Math.floor(Math.random() * 4)
//   ] as UserRole,
//   status: ['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING_VERIFICATION'][
//     Math.floor(Math.random() * 4)
//   ] as UserStatus,
//   createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
//     .toISOString()
//     .split('T')[0],
//   courses: Math.floor(Math.random() * 10),
//   gender: Math.random() > 0.5 ? ('MALE' as Gender) : ('FEMALE' as Gender),
//   birthDate: undefined,
//   phoneNumber: undefined,
//   location: undefined,
//   professionalTitle: undefined,
//   bio: undefined,
//   aboutMe: undefined,
//   bankAccountNumber: undefined,
//   bankName: undefined,
//   bankAccountHolderName: undefined,
//   skills: [],
//   socialLinks: [],
// }));

const UsersManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState([]);
  // Fetch users from API
  const itemsPerPage = 5;
  const { data: fetchedUsers, isLoading } = useAdminGetUsers({
    page: currentPage,
    searchTerm: searchTerm,
    role: selectedRole,
    status: selectedStatus,
    limit: itemsPerPage,
  });

  // Update users when fetchedUsers changes
  useEffect(() => {
    if (fetchedUsers) {
      setUsers(fetchedUsers.users);
      console.log('Fetched users:', fetchedUsers.users);
    }
  }, [fetchedUsers]);

  // Paginate users
  const totalPages = fetchedUsers?.totalPages || 1;

  // Handle viewing user details
  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setViewUserDialogOpen(true);
  };

  // Handle editing user
  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setEditUserDialogOpen(true);
  };

  // Handle saving edited user
  const handleUpdateUser = (userData: any) => {
    setUsers(
      users.map((user) =>
        user.id === userData.id
          ? {
              ...user,
              name: userData.fullName,
              email: userData.email,
              role: userData.role as UserRole,
              status: userData.status as UserStatus,
              gender: userData.gender ? userData.gender : null,
              birthDate: userData.birthDate || undefined,
              phoneNumber: userData.phoneNumber || undefined,
              location: userData.location || undefined,
              // Instructor fields
              professionalTitle: userData.professionalTitle || undefined,
              bio: userData.bio || undefined,
              aboutMe: userData.aboutMe || undefined,
              bankAccountNumber: userData.bankAccountNumber || undefined,
              bankName: userData.bankName || undefined,
              bankAccountHolderName:
                userData.bankAccountHolderName || undefined,
              skills:
                userData.skills?.split(',').map((s: string) => s.trim()) ||
                undefined,
              socialLinks: [
                { platform: 'LINKEDIN', url: userData.linkedinUrl || '' },
                { platform: 'GITHUB', url: userData.githubUrl || '' },
                { platform: 'TWITTER', url: userData.twitterUrl || '' },
              ].filter((link) => link.url),
            }
          : user
      )
    );

    toast({
      title: 'User updated',
      description: 'The user has been updated successfully.',
    });
  };

  // Handle user deletion
  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter((user) => user.id !== userId));

    toast({
      title: 'User deleted',
      description: 'The user has been deleted successfully.',
      variant: 'destructive',
    });
  };

  // Handle adding a new user
  const handleAddUser = (userData: any) => {
    const newUser: User = {
      AccountID: Math.max(...users.map((user) => user.AccountID)) + 1,
      FullName: userData.fullName,
      Email: userData.email,
      RoleID: userData.role as UserRole,
      Status: 'ACTIVE' as UserStatus,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      AvatarUrl: userData.avatarUrl || null,
      HasSocialLogin: userData.hasSocialLogin || false,
      courses: 0,
      gender: userData.gender || null,
      birthDate: userData.birthDate || undefined,
      phoneNumber: userData.phoneNumber || undefined,
      location: userData.location || undefined,
    };

    // Add instructor specific data if the role is instructor
    if (userData.role === 'INSTRUCTOR') {
      newUser.professionalTitle = userData.professionalTitle || '';
      newUser.bio = userData.bio || '';
      newUser.aboutMe = userData.aboutMe || '';
      newUser.bankAccountNumber = userData.bankAccountNumber || '';
      newUser.bankName = userData.bankName || '';
      newUser.bankAccountHolderName = userData.bankAccountHolderName || '';
      newUser.skills =
        userData.skills?.split(',').map((s: string) => s.trim()) || [];
      newUser.socialLinks = [
        { platform: 'LINKEDIN', url: userData.linkedinUrl || '' },
        { platform: 'GITHUB', url: userData.githubUrl || '' },
        { platform: 'TWITTER', url: userData.twitterUrl || '' },
      ].filter((link) => link.url);
    }

    setUsers([newUser, ...users]);

    toast({
      title: 'User added',
      description: 'The new user has been added successfully.',
    });

    setAddUserDialogOpen(false);
  };

  return (
    <AdminLayout>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold'>User Management</h1>
          <Button onClick={() => setAddUserDialogOpen(true)}>
            <UserPlus className='mr-2 h-4 w-4' /> Add New User
          </Button>
        </div>

        <UserFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
        />

        <UserTable
          users={fetchedUsers?.users || []}
          onViewUser={handleViewUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
        />

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {/* Add User Dialog */}
      <AddUserDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        onAddUser={handleAddUser}
      />

      {/* View User Dialog */}
      {selectedUser && (
        <UserViewDialog
          user={selectedUser}
          open={viewUserDialogOpen}
          onOpenChange={setViewUserDialogOpen}
        />
      )}

      {/* Edit User Dialog */}
      <UserEditDialog
        user={selectedUser}
        open={editUserDialogOpen}
        onOpenChange={setEditUserDialogOpen}
        onSave={handleUpdateUser}
      />
    </AdminLayout>
  );
};

export default UsersManagement;
