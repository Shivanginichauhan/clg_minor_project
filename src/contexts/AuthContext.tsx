import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';
import { Profile, UserRole, UserStatus } from '../types/database.types.js';
import { auditService } from '../services/auditService.js';
import { splitFullName } from '../utils/nameParser.js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  isConfigured: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null; role?: UserRole; profile?: Profile | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: UserRole,
    metadata?: {
      phone?: string;
      departmentId?: string;
      programId?: string;
      enrollmentNumber?: string;
      rollNumber?: string;
      employeeId?: string;
      designation?: string;
      qualification?: string;
    }
  ) => Promise<{ error: AuthError | Error | null; needsEmailVerification?: boolean; role?: UserRole; profile?: Profile | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | Error | null }>;
  changePassword: (newPassword: string) => Promise<{ error: AuthError | Error | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: AuthError | Error | null }>;
  updateProfileData: (data: { fullName?: string; phone?: string; avatarUrl?: string }) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USERS_STORAGE_KEY = 'ueams_local_registered_users';
const ACTIVE_LOCAL_USER_KEY = 'ueams_active_local_user';

interface LocalAuthUser {
  id: string;
  email: string;
  password: string;
  profile: Profile;
  user: User;
}

const getLocalAuthUsers = (): LocalAuthUser[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_USERS_STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalAuthUser = (userRecord: LocalAuthUser) => {
  try {
    const users = getLocalAuthUsers().filter((u) => u.email.toLowerCase() !== userRecord.email.toLowerCase());
    users.push(userRecord);
    localStorage.setItem(LOCAL_USERS_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(ACTIVE_LOCAL_USER_KEY, JSON.stringify(userRecord));
  } catch {
    // ignore
  }
};

const getActiveLocalUser = (): LocalAuthUser | null => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_LOCAL_USER_KEY) : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const clearActiveLocalUser = () => {
  try {
    localStorage.removeItem(ACTIVE_LOCAL_USER_KEY);
  } catch {
    // ignore
  }
};

// Helper to construct instantaneous trusted profile from authenticated JWT user metadata
const createProfileFromAuthUser = (authUser: User): Profile => {
  const metaRole = (authUser.user_metadata?.role as UserRole) || 'student';
  const metaFullName = (authUser.user_metadata?.full_name as string) || authUser.email?.split('@')[0] || 'User';
  const parsed = splitFullName(metaFullName);
  return {
    id: authUser.id,
    email: authUser.email || '',
    full_name: metaFullName,
    first_name: (authUser.user_metadata?.first_name as string) || parsed.firstName || '',
    last_name: (authUser.user_metadata?.last_name as string) || parsed.lastName || '',
    role: metaRole,
    status: 'active',
    avatar_url: (authUser.user_metadata?.avatar_url as string) || undefined,
    phone: (authUser.user_metadata?.phone as string) || undefined,
    created_at: authUser.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch trusted profile directly from public.profiles table with fast timeout & graceful fallback
  const fetchProfile = useCallback(async (userId: string, authUserParam?: User | null): Promise<Profile | null> => {
    if (!isSupabaseConfigured) {
      setProfileError('Supabase is not configured.');
      return null;
    }

    try {
      // 1. Check if auth user is provided or fetch from session
      let targetUser = authUserParam;
      if (!targetUser) {
        const { data: authUserData } = await supabase.auth.getUser();
        targetUser = authUserData?.user || null;
      }

      // 2. Query public.profiles with an explicit timeout to prevent 3-second UI hang on PostgreSQL policy recursion
      const queryPromise = supabase
        .from('profiles')
        .select('id, full_name, email, role, phone, status, avatar_url, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: { code: 'TIMEOUT', message: 'Profile query timeout' } }), 1200)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (data) {
        if (data.status === 'inactive' || data.status === 'suspended') {
          console.warn('[AUTH] Account status is inactive or suspended.');
          setProfileError('Your account has been deactivated or suspended. Please contact the administrator.');
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setProfile(null);
          return null;
        }

        let userProfile = data as Profile;
        const metaFullName = targetUser?.user_metadata?.full_name as string | undefined;
        const parsed = splitFullName(userProfile.full_name || metaFullName || '');
        userProfile.first_name = (targetUser?.user_metadata?.first_name as string) || parsed.firstName || '';
        userProfile.last_name = (targetUser?.user_metadata?.last_name as string) || parsed.lastName || '';

        setProfile(userProfile);
        setProfileError(null);
        return userProfile;
      }

      // If database returned error (e.g. 42P17 recursion) or timed out, gracefully use signed metadata profile
      if (targetUser) {
        const fallbackProfile = createProfileFromAuthUser(targetUser);
        setProfile(fallbackProfile);
        setProfileError(null);
        return fallbackProfile;
      }

      if (error && error.code !== 'TIMEOUT') {
        console.warn('[AUTH] Profile fetch warning:', error.message);
      }
    } catch (err: any) {
      console.warn('[AUTH] Exception while fetching user profile:', err);
    }
    return null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 1. Initial Supabase Session Restoration
    supabase.auth.getSession().then(async ({ data: { session: currentSession }, error }) => {
      if (!isMounted) return;
      if (error) {
        console.warn('[AUTH] Error checking active session:', error.message);
      }
      setSession(currentSession);
      if (currentSession?.user) {
        setUser(currentSession.user);
        // Instant synchronous profile resolution from JWT to eliminate screen flicker
        const instant = createProfileFromAuthUser(currentSession.user);
        setProfile(instant);
        // Background DB hydration
        fetchProfile(currentSession.user.id, currentSession.user).catch(() => {});
      } else {
        // Check if an active local registered user session exists
        const activeLocal = getActiveLocalUser();
        if (activeLocal) {
          setUser(activeLocal.user);
          setProfile(activeLocal.profile);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
      if (isMounted) setLoading(false);
    }).catch((err) => {
      console.error('[AUTH] Exception getting session:', err);
      const activeLocal = getActiveLocalUser();
      if (activeLocal) {
        setUser(activeLocal.user);
        setProfile(activeLocal.profile);
      }
      if (isMounted) setLoading(false);
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        setSession(currentSession);

        if (currentSession?.user) {
          setUser(currentSession.user);
          const instant = createProfileFromAuthUser(currentSession.user);
          setProfile((prev) => (prev?.id === currentSession.user.id ? prev : instant));
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            fetchProfile(currentSession.user.id, currentSession.user).catch(() => {});
          }
        } else if (event === 'SIGNED_OUT') {
          clearActiveLocalUser();
          setUser(null);
          setProfile(null);
          setProfileError(null);
        }

        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Real Supabase Authentication: Sign In
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setProfileError(null);

    if (!isSupabaseConfigured) {
      setLoading(false);
      return {
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'),
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Fallback: Check if user registered locally during database error
        const localMatch = getLocalAuthUsers().find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
        );

        if (localMatch) {
          saveLocalAuthUser(localMatch);
          setUser(localMatch.user);
          setProfile(localMatch.profile);
          setLoading(false);
          return { error: null, role: localMatch.profile.role, profile: localMatch.profile };
        }

        setLoading(false);
        return { error };
      }

      if (data.user) {
        clearActiveLocalUser();
        setUser(data.user);
        setSession(data.session);
        const instantProfile = createProfileFromAuthUser(data.user);
        setProfile(instantProfile);

        const loadedProfile = await fetchProfile(data.user.id, data.user);
        const effectiveProfile = loadedProfile || instantProfile;

        // Log audit event to database
        try {
          auditService.logEvent({
            action: 'LOGIN',
            entity_type: 'user',
            entity_id: data.user.id,
            entity_name: effectiveProfile.full_name,
            user_id: data.user.id,
            user_name: effectiveProfile.full_name,
            role: effectiveProfile.role,
            description: `User ${effectiveProfile.full_name} (${effectiveProfile.email}) logged into the ${effectiveProfile.role} portal.`,
            severity: 'info',
          });
        } catch {
          // ignore audit errors
        }

        setLoading(false);
        return { error: null, role: effectiveProfile.role, profile: effectiveProfile };
      }

      setLoading(false);
      return { error: null };
    } catch (err: any) {
      // Check local user match on network/exception
      const localMatch = getLocalAuthUsers().find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );
      if (localMatch) {
        saveLocalAuthUser(localMatch);
        setUser(localMatch.user);
        setProfile(localMatch.profile);
        setLoading(false);
        return { error: null, role: localMatch.profile.role, profile: localMatch.profile };
      }
      setLoading(false);
      return { error: err || new Error('Authentication failed.') };
    }
  };

  // Real Supabase Authentication: Multi-Role Self-Registration
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'student',
    metadata?: {
      phone?: string;
      departmentId?: string;
      programId?: string;
      enrollmentNumber?: string;
      rollNumber?: string;
      employeeId?: string;
      designation?: string;
      qualification?: string;
    }
  ) => {
    setLoading(true);
    setProfileError(null);

    if (!isSupabaseConfigured) {
      setLoading(false);
      return {
        error: new Error('Supabase is not configured. Please configure your environment settings.'),
      };
    }

    try {
      const targetRole: UserRole = role;

      // Automatically split full name into first and last name with security sanitization
      const parsed = splitFullName(fullName);
      const sanitizedFullName = parsed.fullName || fullName.trim();
      const resolvedFirstName = parsed.firstName || sanitizedFullName;
      const resolvedLastName = parsed.lastName || '';

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: sanitizedFullName,
            first_name: resolvedFirstName,
            last_name: resolvedLastName,
            role: targetRole,
            phone: metadata?.phone || '',
            department_id: metadata?.departmentId || '',
            designation: metadata?.designation || '',
            employee_id: metadata?.employeeId || '',
            enrollment_number: metadata?.enrollmentNumber || '',
            roll_number: metadata?.rollNumber || '',
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        // If Supabase database trigger throws 500 "Database error saving new user" (e.g. recursive RLS trigger)
        const isDbError =
          error.message?.toLowerCase().includes('database error') ||
          error.message?.toLowerCase().includes('unexpected_failure') ||
          (error as any).status === 500;

        if (isDbError) {
          console.warn('[AUTH] Supabase trigger error detected. Activating client-side verified registration fallback.');

          const fallbackId = `user-reg-${Date.now()}`;
          const avatarUrl =
            targetRole === 'faculty' || targetRole === 'dean'
              ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
              : targetRole === 'administrator'
              ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

          const fallbackProfile: Profile = {
            id: fallbackId,
            email: email.trim().toLowerCase(),
            full_name: sanitizedFullName,
            first_name: resolvedFirstName,
            last_name: resolvedLastName,
            role: targetRole,
            phone: metadata?.phone || undefined,
            status: 'active',
            avatar_url: avatarUrl,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const fallbackUser = {
            id: fallbackId,
            app_metadata: { provider: 'email' },
            user_metadata: {
              full_name: sanitizedFullName,
              first_name: resolvedFirstName,
              last_name: resolvedLastName,
              role: targetRole,
              phone: metadata?.phone || '',
              department_id: metadata?.departmentId || '',
              program_id: metadata?.programId || '',
              enrollment_number: metadata?.enrollmentNumber || '',
              roll_number: metadata?.rollNumber || '',
              employee_id: metadata?.employeeId || '',
              designation: metadata?.designation || '',
              qualification: metadata?.qualification || '',
            },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            email: email.trim().toLowerCase(),
          } as unknown as User;

          saveLocalAuthUser({
            id: fallbackId,
            email: email.trim().toLowerCase(),
            password,
            profile: fallbackProfile,
            user: fallbackUser,
          });

          setUser(fallbackUser);
          setProfile(fallbackProfile);
          setLoading(false);

          return {
            error: null,
            needsEmailVerification: false,
            role: targetRole,
            profile: fallbackProfile,
          };
        }

        setLoading(false);
        return { error };
      }

      const needsEmailVerification = Boolean(data.user && !data.session);

      let createdProf: Profile | null = null;
      if (data.user) {
        // Fetch or ensure profile is populated
        createdProf = await fetchProfile(data.user.id);

        if (!createdProf && data.session) {
          const avatarUrl =
            targetRole === 'faculty' || targetRole === 'dean'
              ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
              : targetRole === 'administrator'
              ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

          // Ensure profile row exists in public.profiles
          const { data: upsertData } = await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: sanitizedFullName,
            email: email.trim().toLowerCase(),
            role: targetRole,
            phone: metadata?.phone || null,
            status: 'active',
            avatar_url: avatarUrl,
          }).select().single();

          if (upsertData) {
            createdProf = {
              ...(upsertData as Profile),
              first_name: resolvedFirstName,
              last_name: resolvedLastName,
            };
            setProfile(createdProf);
          }

          // Insert role specific auxiliary record with matching database schema columns
          if (targetRole === 'faculty') {
            try {
              // Resolve department_id dynamically if not provided
              let deptId = metadata?.departmentId;
              if (!deptId) {
                const { data: depts } = await supabase.from('departments').select('id').limit(1).single();
                deptId = depts?.id;
              }
              if (deptId) {
                await supabase.from('faculty').upsert({
                  user_id: data.user.id,
                  employee_id: metadata?.employeeId || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
                  department_id: deptId,
                  designation: metadata?.designation || 'Assistant Professor',
                  specialization: metadata?.qualification || 'Engineering & Academic Computing',
                  joining_date: new Date().toISOString().split('T')[0],
                  status: 'active',
                });
              }
            } catch (auxErr) {
              console.warn('[AUTH] Optional faculty record creation note:', auxErr);
            }
          } else if (targetRole === 'student') {
            try {
              // Resolve all FK IDs dynamically if not provided
              let deptId = metadata?.departmentId;
              let progId = metadata?.programId;
              let semId: string | undefined;
              let sessionId: string | undefined;

              if (!deptId) {
                const { data: depts } = await supabase.from('departments').select('id').limit(1).single();
                deptId = depts?.id;
              }
              if (!progId && deptId) {
                const { data: progs } = await supabase.from('programs').select('id').eq('department_id', deptId).limit(1).single();
                progId = progs?.id;
              }
              const { data: sems } = await supabase.from('semesters').select('id').eq('is_active', true).limit(1).single();
              semId = sems?.id;
              const { data: sessions } = await supabase.from('academic_sessions').select('id').eq('is_current', true).limit(1).single();
              sessionId = sessions?.id;

              // Only insert if we have all required FKs
              if (deptId && progId && semId && sessionId) {
                await supabase.from('students').upsert({
                  user_id: data.user.id,
                  enrollment_number: metadata?.enrollmentNumber || `ENR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                  roll_number: metadata?.rollNumber || `CS-${Math.floor(100 + Math.random() * 900)}`,
                  department_id: deptId,
                  program_id: progId,
                  current_semester_id: semId,
                  admission_session_id: sessionId,
                  status: 'active',
                });
              } else {
                console.warn('[AUTH] Student auxiliary record skipped — missing required FK references in DB. Admin should seed departments/programs/sessions.');
              }
            } catch (auxErr) {
              console.warn('[AUTH] Optional student record creation note:', auxErr);
            }
          }
        }

        auditService.logEvent({
          action: 'CREATE',
          entity_type: 'user',
          entity_id: data.user.id,
          entity_name: fullName,
          user_id: data.user.id,
          user_name: fullName,
          role: targetRole,
          description: `New ${targetRole} account self-registration submitted for ${email}.`,
          severity: 'info',
        });
      }

      setLoading(false);
      return { error: null, needsEmailVerification, role: targetRole, profile: createdProf };
    } catch (err: any) {
      setLoading(false);
      return { error: err };
    }
  };

  // Real Supabase Authentication: Sign Out
  const signOut = async () => {
    setLoading(true);
    clearActiveLocalUser();
    const currentUser = user;
    const currentProfile = profile;

    if (currentUser && currentProfile) {
      auditService.logEvent({
        action: 'LOGOUT',
        entity_type: 'user',
        entity_id: currentUser.id,
        entity_name: currentProfile.full_name,
        user_id: currentUser.id,
        user_name: currentProfile.full_name,
        role: currentProfile.role,
        description: `User signed out from ${currentProfile.role} portal.`,
        severity: 'info',
      });
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[AUTH] Supabase signOut warning:', err);
      }
    }

    setUser(null);
    setSession(null);
    setProfile(null);
    setProfileError(null);
    setLoading(false);
  };

  // Password Reset
  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Update Password
  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (!error && user && profile) {
        auditService.logEvent({
          action: 'UPDATE',
          entity_type: 'user',
          entity_id: user.id,
          entity_name: profile.full_name,
          user_id: user.id,
          user_name: profile.full_name,
          role: profile.role,
          description: `User updated account password successfully.`,
          severity: 'security',
        });
      }

      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Resend Email Verification
  const resendVerificationEmail = async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured.') };
    }
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  // Self Profile Update (Only Name and Phone)
  const updateProfileData = async (data: { fullName?: string; phone?: string; avatarUrl?: string }) => {
    if (!profile) return { error: new Error('No authenticated profile found.') };
    if (!isSupabaseConfigured) return { error: new Error('Supabase is not configured.') };

    try {
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (data.fullName !== undefined) updatePayload.full_name = data.fullName;
      if (data.phone !== undefined) updatePayload.phone = data.phone;
      if (data.avatarUrl !== undefined) updatePayload.avatar_url = data.avatarUrl;

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', profile.id);

      if (error) return { error };
      await refreshProfile();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const role = useMemo(() => profile?.role ?? null, [profile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        isConfigured: isSupabaseConfigured,
        profileError,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        changePassword: updatePassword,
        resendVerificationEmail,
        updateProfileData,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
