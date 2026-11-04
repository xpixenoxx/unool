'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export interface UserContextType {
  user: any | null;
  profile: any | null;
  workspace: any | null;
  pendingPostsCount: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [workspace, setWorkspace] = useState<any | null>(null);
  const [pendingPostsCount, setPendingPostsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserContext = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setProfile(null);
        setWorkspace(null);
        setPendingPostsCount(0);
        setLoading(false);
        return;
      }

      setUser(authUser);

      // Fetch Profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (userProfile) {
        setProfile(userProfile);
      }

      // Fetch Default/Active Workspace
      const { data: userWorkspace } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', authUser.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (userWorkspace) {
        setWorkspace(userWorkspace);

        // Fetch Pending Posts Count for workspace
        const { count } = await supabase
          .from('scheduled_posts')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', userWorkspace.id)
          .eq('status', 'scheduled');

        setPendingPostsCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching User Context:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserContext();
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        workspace,
        pendingPostsCount,
        loading,
        refetch: fetchUserContext,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

export function useOptionalUserContext(): UserContextType | undefined {
  return useContext(UserContext);
}
