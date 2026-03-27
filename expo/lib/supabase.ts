import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://oncwgmehzjejmqqsopvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uY3dnbWVoemplam1xcXNvcHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDUyOTIsImV4cCI6MjA4NjcyMTI5Mn0.4N3I_UoAy-aQEHZDJpKZyXAFz5Zhd1lWb9LA-CJFPL0';

const TOKEN_KEY = 'zito_supabase_token';
const REFRESH_KEY = 'zito_supabase_refresh';

export interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: SupabaseUser;
}

interface AuthResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: SupabaseUser;
  error?: string;
  error_description?: string;
  msg?: string;
}

async function authRequest(endpoint: string, body: Record<string, string>): Promise<AuthResponse> {
  const url = `${SUPABASE_URL}/auth/v1/${endpoint}`;
  console.log('[Supabase] Auth request:', endpoint);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  console.log('[Supabase] Auth response status:', res.status);

  if (!res.ok) {
    const errorMsg = data.error_description || data.msg || data.error || 'Authentication failed';
    throw new Error(errorMsg);
  }

  return data;
}

export async function signUp(email: string, password: string): Promise<AuthSession> {
  const data = await authRequest('signup', { email, password });

  if (!data.access_token) {
    if (data.user && !data.access_token) {
      throw new Error('Check your email for a confirmation link to complete sign up.');
    }
    throw new Error('Sign up failed. Please try again.');
  }

  await saveTokens(data.access_token, data.refresh_token || '');
  return data as AuthSession;
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const data = await authRequest('token?grant_type=password', { email, password });

  if (!data.access_token) {
    throw new Error('Sign in failed. Please try again.');
  }

  await saveTokens(data.access_token, data.refresh_token || '');
  return data as AuthSession;
}

export async function signOut(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch (e) {
    console.log('[Supabase] Sign out request error (non-critical):', e);
  }
  await clearTokens();
}

export async function refreshSession(): Promise<AuthSession | null> {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return null;

    const data = await authRequest('token?grant_type=refresh_token', {
      refresh_token: refreshToken,
    });

    if (!data.access_token) return null;

    await saveTokens(data.access_token, data.refresh_token || refreshToken);
    return data as AuthSession;
  } catch (e) {
    console.log('[Supabase] Refresh failed:', e);
    await clearTokens();
    return null;
  }
}

export async function getUser(): Promise<SupabaseUser | null> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const session = await refreshSession();
      return session?.user || null;
    }

    const user = await res.json();
    return user as SupabaseUser;
  } catch (e) {
    console.log('[Supabase] Get user error:', e);
    return null;
  }
}

export async function resetPassword(email: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error_description || data.msg || 'Failed to send reset email');
  }
}

async function saveTokens(access: string, refresh: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, access);
  if (refresh) {
    await AsyncStorage.setItem(REFRESH_KEY, refresh);
  }
}

async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}
