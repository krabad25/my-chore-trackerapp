import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface AuthState {
  isAuthenticated: boolean;
  userId: number | null;
  userRole: string | null;
  userName: string | null;
}

const getInitialAuthState = (): AuthState => {
  return {
    isAuthenticated: false,
    userId: null,
    userRole: null,
    userName: null,
  };
};

// Use a simple subscription model for sharing auth state across components
const subscribers: ((authState: AuthState) => void)[] = [];
let globalAuthState = getInitialAuthState();

function setAuthState(newState: Partial<AuthState>) {
  globalAuthState = { ...globalAuthState, ...newState };
  // Notify all subscribers of the state change
  subscribers.forEach(subscriber => subscriber(globalAuthState));
}

function clearAuthState() {
  globalAuthState = getInitialAuthState();
  // Notify all subscribers of the state change
  subscribers.forEach(subscriber => subscriber(globalAuthState));
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(globalAuthState);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch current user on mount
  const { data: user, isLoading: isLoadingUser, isError } = useQuery<User | null>({
    queryKey: ['/api/user'],
    retry: false,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      if (data) {
        setAuthState({
          isAuthenticated: true,
          userId: data.id,
          userRole: data.role,
          userName: data.name,
        });
      }
    },
    onError: () => {
      clearAuthState();
    }
  });

  // Subscribe to auth state changes
  useEffect(() => {
    const handler = (newState: AuthState) => setState(newState);
    subscribers.push(handler);
    return () => {
      const index = subscribers.indexOf(handler);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    };
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return apiRequest<User>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
    onSuccess: (user) => {
      setAuthState({
        isAuthenticated: true,
        userId: user.id,
        userRole: user.role,
        userName: user.name,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${user.name}!`,
      });
      return user;
    },
    onError: (error: any) => {
      toast({
        title: 'Login Failed',
        description: error?.message || 'Invalid username or password',
        variant: 'destructive',
      });
      return null;
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/auth/logout', { method: 'POST' });
    },
    onSuccess: () => {
      clearAuthState();
      queryClient.invalidateQueries();
      toast({
        title: 'Logged Out',
        description: 'You have been logged out successfully.',
      });
    },
  });

  const login = useCallback(async (username: string, password: string) => {
    try {
      return await loginMutation.mutateAsync({ username, password });
    } catch (error) {
      return null;
    }
  }, [loginMutation]);

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return {
    user,
    isAuthenticated: state.isAuthenticated,
    isChild: state.userRole === 'child',
    isParent: state.userRole === 'parent',
    userId: state.userId,
    userName: state.userName,
    userRole: state.userRole,
    login,
    logout,
    isLoading: isLoadingUser || loginMutation.isPending || logoutMutation.isPending,
  };
}

// Helper hook specifically for parent mode checks
export function useParentAuth() {
  const auth = useAuth();
  
  return {
    ...auth,
    isParentMode: auth.isAuthenticated && auth.isParent,
  };
}