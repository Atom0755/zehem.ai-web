import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const sendLoginLink = useCallback(async (email, redirectTo) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Email link failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);


const signOut = useCallback(async () => {
  try {
    // 1️⃣ 调 Supabase 登出（即使报错也继续）
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn("Supabase signOut warning:", error.message);
    }

    // 2️⃣ 清理可能残留的本地 session
    try {
      localStorage.removeItem("sb-access-token");
      localStorage.removeItem("sb-refresh-token");
    } catch (e) {}

    // 3️⃣ 强制刷新到首页（解决 Auth session missing）
    window.location.href = "/";
  } catch (err) {
    console.error("Logout failed:", err);
    window.location.href = "/";
  }
}, []);
  

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    sendLoginLink,
    signOut,
  }), [user, session, loading, signUp, signIn,
    sendLoginLink, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
