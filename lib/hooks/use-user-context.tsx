'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

interface Profile {
  id: string;
  name: string;
  headline: string;
  subdomain: string | null;
  status: 'published' | 'draft';
  theme: { preset: string };
}

interface Workspace {
  id: string;
  name: string;
  planTier: string;
}

interface UserContext {
  user: User | null;
  profile: Profile | null;
  workspace: Workspace | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContext | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserContext = async () => {
    try {
      const res = await fetch('/api/user/context', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
        setWorkspace(data.workspace);
      }
    } catch (error) {
      console.error('Failed to fetch user context:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserContext();
  }, []);

  return (
    <UserContext.Provider value={{ user, profile, workspace, loading, refetch: fetchUserContext }}>
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