import { useCallback, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";

interface AuthState {
  isAuthenticated: boolean;
  userId: number | null;
  userRole: string | null;
  userName: string | null;
}

// Initialize auth state from localStorage if available
const getInitialAuthState = (): AuthState => {
  const savedAuth = localStorage.getItem('authState');
  if (savedAuth) {
    try {
      return JSON.parse(savedAuth);
    } catch (e) {
      // If there's an error parsing, return default state
      return {
        isAuthenticated: false,
        userId: null,
        userRole: null,
        userName: null
      };
    }
  }
  return {
    isAuthenticated: false,
    userId: null,
    userRole: null,
    userName: null
  };
};

// Global auth state
let authState = getInitialAuthState();

// Subscribers to auth state changes
const subscribers: ((authState: AuthState) => void)[] = [];

// Update auth state and notify subscribers
function setAuthState(newState: Partial<AuthState>) {
  authState = { ...authState, ...newState };
  localStorage.setItem('authState', JSON.stringify(authState));
  subscribers.forEach(subscriber => subscriber(authState));
}

// Clear auth state on logout
function clearAuthState() {
  authState = {
    isAuthenticated: false,
    userId: null,
    userRole: null,
    userName: null
  };
  localStorage.removeItem('authState');
  subscribers.forEach(subscriber => subscriber(authState));
}

export function useAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(authState);
  const [isLoading, setIsLoading] = useState(false);

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

  // User data query
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user", state.userId],
    enabled: state.isAuthenticated && !!state.userId,
  });

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      
      if (response && 'user' in response) {
        const userData = response.user as User;
        
        setAuthState({
          isAuthenticated: true,
          userId: userData.id,
          userRole: userData.role,
          userName: userData.name
        });
        
        // Invalidate any existing user data
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        
        return userData;
      }
      return null;
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid username or password.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, queryClient]);

  const logout = useCallback(() => {
    setIsLoading(true);
    apiRequest("POST", "/api/auth/logout", {})
      .then(() => {
        clearAuthState();
        queryClient.clear();
      })
      .catch((error) => {
        console.error("Logout error:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [queryClient]);

  return {
    user,
    isAuthenticated: state.isAuthenticated,
    userId: state.userId,
    userRole: state.userRole,
    userName: state.userName,
    isParent: state.userRole === 'parent',
    isChild: state.userRole === 'child',
    login,
    logout,
    isLoading,
  };
}

// Legacy parent auth for compatibility during transition
export function useParentAuth() {
  const { isAuthenticated, userRole, login, logout, isLoading } = useAuth();
  
  const authenticate = useCallback(async (pin: string) => {
    try {
      await apiRequest("POST", "/api/auth/parent", { pin });
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  return {
    isAuthenticated: isAuthenticated && userRole === 'parent',
    authenticate,
    logout,
    isLoading,
  };
}