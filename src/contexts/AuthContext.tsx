// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User as AppUser, Profile as AppProfile } from '../types';

type AuthContextType = {
  user: any | null; // supabase user object (keep as any for supabase shape)
  profile: AppProfile | null; // profile row from 'profiles' table
  isLoading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<AppProfile | null>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial session + profile
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session ?? null;
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) await loadProfile(session.user.id);
      setIsLoading(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).catch((e) => console.error('loadProfile error', e));
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      // unsubscribe listener
      listener?.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

// inside AuthContext.tsx - replace existing loadProfile with this
const loadProfile = async (userId: string): Promise<AppProfile | null> => {
  // call without generic to avoid TS generic arity mismatch
  const res = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  // cast data to your Profile type
  const data = res.data as AppProfile | null;
  const error = res.error;

  if (error) {
    // If no profile found or another issue, set null and return
    console.warn('loadProfile error', error);
    setProfile(null);
    return null;
  }
  setProfile(data);
  return data;
};


  const refreshProfile = async () => {
    if (!user) return null;
    return await loadProfile(user.id);
  };

  // Sign up: create auth user + profile row
// --- Replace your existing signUp function with this ---
const signUp = async (
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      console.error("❌ Signup error:", error.message);
      return { success: false, message: error.message };
    }

    console.log("✅ Signup response:", data);

    if (data?.session) {
      console.log("🎉 Session created immediately:", data.session);
      setUser(data.user);
      return { success: true, message: "Signup successful!" };
    } else {
      console.warn("⚠️ No session returned. Trying to get current session...");
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        console.log("✅ Got session after refresh:", sessionData.session);
        setUser(sessionData.session.user);
        return { success: true, message: "Signup successful!" };
      } else {
        console.error("🚫 No session found even after refresh.");
        return {
          success: true,
          message:
            "Signup succeeded! Please check your email to confirm your account.",
        };
      }
    }
  } catch (err) {
    console.error("Unexpected signup error:", err);
    return { success: false, message: "Unexpected signup error occurred." };
  }
};

// --- Replace your existing signIn function with this ---
const signIn = async (
  email: string,
  password: string
): Promise<{ success: boolean; message: string }> => {
  setIsLoading(true);
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("❌ SignIn error:", error.message);
      if (error.message.includes("Invalid login credentials")) {
        return { success: false, message: "Invalid email or password." };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: "Logged in successfully!" };
  } catch (err) {
    console.error("Unexpected signIn error:", err);
    return { success: false, message: "Unexpected sign-in error occurred." };
  } finally {
    setIsLoading(false);
  }
};

  // Social login (Google) - will redirect/popup depending on provider config
  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
      // Supabase will handle redirect; onAuthStateChange will pick up session later
    } catch (err) {
      console.error('Google SignIn error', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.warn('LogOut error', error);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('LogOut error', err);
    } finally {
      setIsLoading(false);
    }
  };
  

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    refreshProfile,
    login: signIn,     // alias: login(email,password) -> signIn(...)
    signup: signUp,    // alias: signup(name,email,password) -> signUp(email,password)
    loginWithGoogle: signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
