export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  department?: string;
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  desktop: boolean;
  sustainability_alerts: boolean;
  portfolio_updates: boolean;
}

export enum UserRole {
  ANALYST = 'analyst',
  ADMIN = 'admin',
  AUDITOR = 'auditor',
  VIEWER = 'viewer',
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
