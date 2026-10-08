import { apiClient } from './client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export async function loginDemoUser(): Promise<AuthTokens> {
  const res = await apiClient.post<AuthTokens>('/auth/login', {
    email: 'demo@spendiq.ai',
    password: 'DemoPass123!',
  });
  apiClient.setToken(res.access_token);
  return res;
}

export async function ensureAuthenticated(): Promise<string> {
  let token = apiClient.getToken();
  if (!token) {
    try {
      const authData = await loginDemoUser();
      token = authData.access_token;
    } catch (err) {
      console.error('Auto authentication error:', err);
    }
  }
  return token || '';
}
