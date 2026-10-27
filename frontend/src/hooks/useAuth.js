import { useState, useEffect, useCallback } from 'react';
import { getAuthSession, clearAuthSession, saveAuthSession } from '../auth.js';

export function useAuth() {
  const [session, setSession] = useState(() => getAuthSession());
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Validate session on mount
    const current = getAuthSession();
    setSession(current);
  }, []);

  const login = useCallback((credential, payload) => {
    const newSession = saveAuthSession(credential, payload);
    setSession(newSession);
    return newSession;
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
    setIsAdmin(false);
  }, []);

  return {
    session,
    isAuthenticated: !!session,
    isAdmin,
    setIsAdmin,
    login,
    logout,
  };
}
