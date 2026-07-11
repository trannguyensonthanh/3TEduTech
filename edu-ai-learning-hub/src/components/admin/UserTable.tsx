import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Check, Edit, Eye, MoreHorizontal, Trash } from 'lucide-react';
import Badge from './Badge';
import { UserProfile } from '@/services/user.service';

// Define types based on the provided database schema
export type UserRole = 'NU' | 'GV' | 'AD' | 'SA';
export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'BANNED'
  | 'PENDING_VERIFICATION';
export type Gender = 'MALE' | 'FEMALE' | null;

export interface SocialLink {
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

interface UserTableProps {
  users: UserProfile[]; // Use the UserProfile type from your service
  onViewUser: (user: UserProfile) => void;
  onEditUser: (user: UserProfile) => void;

  onDeleteUser: (userId: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  onViewUser,
  onEditUser,
  onDeleteUser,
}) => {
  const { t } = useTranslation();
  console.log('UserTable users:', users); // Debugging line
  return (
    <div className='border rounded-md'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('userTable.headers.id')}</TableHead>
            <TableHead>{t('userTable.headers.name')}</TableHead>
            <TableHead>{t('userTable.headers.email')}</TableHead>
            <TableHead>{t('userTable.headers.role')}</TableHead>
            <TableHead>{t('userTable.headers.status')}</TableHead>
            <TableHead>{t('userTable.headers.joined')}</TableHead>
            <TableHead>{t('userTable.headers.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.accountId}>
              <TableCell>{user.accountId}</TableCell>
              <TableCell className='font-medium'>{user.fullName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge
                  className={
                    user.roleId === 'SA'
                      ? 'bg-red-500'
                      : user.roleId === 'AD'
                        ? 'bg-blue-500'
                        : user.roleId === 'GV'
                          ? 'bg-purple-500'
                          : 'bg-gray-500'
                  }
                >
                  {t(`userTable.role.${user.roleId}`)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    user.status === 'ACTIVE'
                      ? 'bg-green-500'
                      : user.status === 'INACTIVE'
                        ? 'bg-yellow-500'
                        : user.status === 'BANNED'
                          ? 'bg-red-500'
                          : 'bg-gray-400'
                  }
                >
                  {t(`userTable.status.${user.status}`)}
                </Badge>
              </TableCell>
              <TableCell>
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleString()
                  : ''}
              </TableCell>
              <TableCell>
                <div className='flex gap-2'>
                  <Button
                    variant='ghost'
                    size='icon'
                    title={t('userTable.actions.view')}
                    onClick={() => onViewUser(user)}
                  >
                    <Eye className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    title={t('userTable.actions.edit')}
                    onClick={() => onEditUser(user)}
                  >
                    <Edit className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    title={t('userTable.actions.delete')}
                    onClick={() => onDeleteUser(user.accountId)}
                  >
                    <Trash className='h-4 w-4' />
                  </Button>
                  {/* <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewUser(user)}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditUser(user)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => onUserRoleChange(user.AccountID, 'NU')}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            user.RoleID === 'NU' ? 'opacity-100' : 'opacity-0'
                          }`}
                        />{' '}
                        Student
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onUserRoleChange(user.AccountID, 'GV')}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            user.RoleID === 'GV' ? 'opacity-100' : 'opacity-0'
                          }`}
                        />{' '}
                        Instructor
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onUserRoleChange(user.AccountID, 'AD')}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            user.RoleID === 'AD' ? 'opacity-100' : 'opacity-0'
                          }`}
                        />{' '}
                        Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onUserRoleChange(user.AccountID, 'SA')}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            user.RoleID === 'SA' ? 'opacity-100' : 'opacity-0'
                          }`}
                        />{' '}
                        Super Admin
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() =>
                          onUserStatusChange(user.AccountID, 'ACTIVE')
                        }
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            user.Status === 'ACTIVE'
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />{' '}
                        Active
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onUserStatusChange(user.AccountID, 'INACTIVE')
                        }
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            user.Status === 'INACTIVE'
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />{' '}
                        Inactive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onUserStatusChange(user.AccountID, 'BANNED')
                        }
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            user.Status === 'BANNED'
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />{' '}
                        Banned
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onUserStatusChange(
                            user.AccountID,
                            'PENDING_VERIFICATION'
                          )
                        }
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            user.Status === 'PENDING_VERIFICATION'
                              ? 'opacity-100'
                              : 'opacity-0'
                          }`}
                        />{' '}
                        Pending Verification
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDeleteUser(user.AccountID)}
                      >
                        <Trash className="mr-2 h-4 w-4" /> Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu> */}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserTable;
