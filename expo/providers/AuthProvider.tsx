import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  SupabaseUser,
  signIn as supaSignIn,
  signUp as supaSignUp,
  signOut as supaSignOut,
  getUser,
  resetPassword as supaResetPassword,
} from '@/lib/supabase';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  const userQuery = useQuery({
    queryKey: ['supabase_user'],
    queryFn: getUser,
    retry: false,
  });

  useEffect(() => {
    if (userQuery.data !== undefined) {
      setUser(userQuery.data);
      console.log('[Auth] User state updated:', userQuery.data?.email ?? 'null');
    }
  }, [userQuery.data]);

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const session = await supaSignIn(email, password);
      return session.user;
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['supabase_user'] });
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const session = await supaSignUp(email, password);
      return session.user;
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['supabase_user'] });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: supaSignOut,
    onSuccess: () => {
      setUser(null);
      queryClient.invalidateQueries({ queryKey: ['supabase_user'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      await supaResetPassword(email);
    },
  });

  const signIn = useCallback((email: string, password: string) => {
    return signInMutation.mutateAsync({ email, password });
  }, [signInMutation]);

  const signUp = useCallback((email: string, password: string) => {
    return signUpMutation.mutateAsync({ email, password });
  }, [signUpMutation]);

  const logOut = useCallback(() => {
    return signOutMutation.mutateAsync();
  }, [signOutMutation]);

  const resetPassword = useCallback((email: string) => {
    return resetPasswordMutation.mutateAsync(email);
  }, [resetPasswordMutation]);

  const isLoading = userQuery.isLoading;
  const isSigningIn = signInMutation.isPending;
  const isSigningUp = signUpMutation.isPending;
  const isSigningOut = signOutMutation.isPending;
  const isResettingPassword = resetPasswordMutation.isPending;

  return {
    user,
    isLoading,
    isSigningIn,
    isSigningUp,
    isSigningOut,
    isResettingPassword,
    isAuthenticated: !!user,
    signIn,
    signUp,
    logOut,
    resetPassword,
  };
});
