// hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user_data');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    localStorage.setItem('user_role', userData.role);
    setUser(userData);
    
    // Redirection basée sur le rôle
    switch (userData.role) {
      case 'ADMIN':
        router.push('/admin/dashboard');
        break;
      case 'GESTIONNAIRE':
        router.push('/gestionnaire/dashboard');
        break;
      case 'CHAUFFEUR':
        router.push('/chauffeur/dashboard');
        break;
      default:
        router.push('/');
    }
  };

const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_data');
  localStorage.removeItem('user_role');
  setUser(null);
  window.location.href = '/auth/login'; // Chemin corrigé
};
  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
};