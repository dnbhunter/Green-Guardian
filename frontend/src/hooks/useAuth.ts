import { useMsal } from '@azure/msal-react';
import { useAuthStore } from '../state/authSlice';
import { loginRequest } from '../services/auth';
import { UserRole } from '../types/auth';

export const useAuth = () => {
  const { instance, accounts } = useMsal();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateUser,
    checkPermission,
  } = useAuthStore();

  const signIn = async () => {
    try {
      const response = await instance.loginPopup(loginRequest);
      if (response.accessToken) {
        await login(response.accessToken);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  };

  const signOut = () => {
    logout();
    instance.logoutPopup({
      postLogoutRedirectUri: window.location.origin,
      mainWindowRedirectUri: window.location.origin,
    });
  };

  const hasRole = (role: UserRole): boolean => {
    return checkPermission([role]);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return checkPermission(roles);
  };

  const canAccess = (requiredRoles?: UserRole[]): boolean => {
    return checkPermission(requiredRoles);
  };

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    signIn,
    signOut,
    updateUser,
    
    // Permission checks
    hasRole,
    hasAnyRole,
    canAccess,
    
    // MSAL data
    accounts,
    msalInstance: instance,
  };
};
