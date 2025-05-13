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

// Temporary function to simulate authentication
// This will be replaced once the real auth system is fixed
const getInitialAuthState = (): AuthState => {
  // Check URL to determine role
  const isParentRoute = window.location.pathname.includes('/parent') || 
                     window.location.pathname.includes('/add-chore') || 
                     window.location.pathname.includes('/add-reward');
  
  // Set simulated auth state based on current route
  return {
    isAuthenticated: true, // Always authenticated for now
    userId: isParentRoute ? 1 : 2, // 1 for parent, 2 for child
    userRole: isParentRoute ? 'parent' : 'child',
    userName: isParentRoute ? 'Parent' : 'Isabela',
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

  // Simulate user data instead of making API calls
  // This will be replaced with the real API call once auth is fixed
  const mockUser: User = {
    id: globalAuthState.userId || 0,
    username: globalAuthState.userRole === 'parent' ? 'AntuAbad' : 'isabela',
    role: globalAuthState.userRole || 'child',
    name: globalAuthState.userName || 'Isabela',
    profilePhoto: null,
    points: 50, // Give some starting points
    parentId: globalAuthState.userRole === 'parent' ? null : 1,
    familyId: 1,
    password: '' // Not used, just needed for the type
  };
  
  // Skip real API call for now
  const { data: user, isLoading: isLoadingUser, isError } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: () => Promise.resolve(mockUser),
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: Infinity, // Never refetch
  });
  
  // Handle user data changes
  useEffect(() => {
    if (user) {
      setAuthState({
        isAuthenticated: true,
        userId: user.id,
        userRole: user.role,
        userName: user.name,
      });
    } else if (isError) {
      clearAuthState();
    }
  }, [user, isError]);

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
      // Immediately clear state to prevent UI issues
      clearAuthState();
      
      return apiRequest('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    },
    onSuccess: () => {
      // Navigate to home page after logout
      window.location.href = '/';
      
      // Clear all queries from the cache
      queryClient.clear();
      
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
    // Already clear auth state immediately on logout click to improve UI responsiveness
    clearAuthState();
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