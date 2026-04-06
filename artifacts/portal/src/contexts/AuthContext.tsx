import React, { createContext, useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogout, type AuthUser } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => void;
  isAdmin: boolean;
  isDeptHead: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading, error } = useGetMe({
    query: {
      retry: false,
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        window.location.href = "/";
      }
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  useEffect(() => {
    // If not loading and there's an error (no user), redirect to splash
    if (!isLoading && error) {
      setLocation("/");
    }
  }, [isLoading, error, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const isDeptHead = user?.role === "department_head";
  const isStaff = user?.role === "staff";

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        logout: handleLogout,
        isAdmin,
        isDeptHead,
        isStaff
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
