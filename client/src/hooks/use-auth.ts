import { useCallback, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useParentAuth() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const authenticate = useCallback(async (pin: string) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/parent", { pin });
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "The PIN you entered is incorrect.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    authenticate,
    logout,
    isLoading,
  };
}
