// src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
} from 'react';
import TokenService from '@/services/token.service';

interface AuthContextType {
  userData: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    avatarUrl: string | null;
    accessToken: string;
  } | null;
  userRole: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<AuthContextType['userData']>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Giả lập async, bạn có thể thay bằng fetch hoặc logic thực tế
    const fetchUser = async () => {
      setIsLoading(true);
      const user = TokenService.getLocalUser();
      setUserData(user);
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const isAuthenticated = !!userData;
  const userRole = userData ? userData.role : null;

  const authValue = useMemo(
    () => ({
      userData,
      userRole,
      isAuthenticated,
      isLoading,
    }),
    [userData, userRole, isAuthenticated, isLoading]
  );

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
