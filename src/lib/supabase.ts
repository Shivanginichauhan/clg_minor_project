import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://pyluhwohywqvetbiykin.supabase.co';

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bHVod29oeXdxdmV0Yml5a2luIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NjMwMTQsImV4cCI6MjEwNDUzOTAxNH0.HYLXj44nWCVztfeEbl_nlJ2bSg5RyLS93gVIL7nP4dg';

const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-ref.supabase.co' &&
  !supabaseUrl.includes('your-project-ref') &&
  supabaseAnonKey !== 'your-anon-publishable-key'
);

// Create the unified Supabase client
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-ueams.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

export interface ConnectionTestResult {
  isConfigured: boolean;
  connected: boolean;
  message: string;
  url?: string;
  error?: string;
  tableCount?: number;
}

export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  if (!isSupabaseConfigured) {
    return {
      isConfigured: false,
      connected: false,
      message: 'Supabase credentials are not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.',
      url: supabaseUrl || undefined,
    };
  }

  try {
    const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        return {
          isConfigured: true,
          connected: true,
          message: 'Supabase connection established. Database schema tables are pending creation.',
          url: supabaseUrl,
          tableCount: 0,
        };
      }
      return {
        isConfigured: true,
        connected: false,
        message: `Supabase reached, but query failed: ${error.message}`,
        url: supabaseUrl,
        error: error.message,
      };
    }

    return {
      isConfigured: true,
      connected: true,
      message: 'Supabase backend is fully connected and ready.',
      url: supabaseUrl,
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      connected: false,
      message: 'Failed to communicate with Supabase backend endpoint.',
      url: supabaseUrl,
      error: err.message || 'Unknown network error',
    };
  }
}
