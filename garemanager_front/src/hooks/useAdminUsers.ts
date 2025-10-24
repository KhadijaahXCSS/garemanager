// hooks/useAdminUsers.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface AdminUserStats {
  total: number;
  parRole: {
    ADMIN: number;
    GESTIONNAIRE: number;
    CHAUFFEUR: number;
  };
  parStatut: {
    ACTIF: number;
    EN_ATTENTE: number;
    SUSPENDU: number;
  };
}

export interface Utilisateur {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'GESTIONNAIRE' | 'CHAUFFEUR';
  statut: 'ACTIF' | 'EN_ATTENTE' | 'SUSPENDU' | 'DESACTIVE';
  CIN?: string;
  telephone?: string;
  date_inscription: string;
  date_validation?: string;
  raison_suspension?: string;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('http://localhost:8000/api/admin/utilisateurs/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const validerGestionnaire = async (userId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`http://localhost:8000/api/admin/utilisateurs/${userId}/valider_inscription/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la validation');
      }

      await fetchUsers(); // Recharger la liste
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation');
      return false;
    }
  };

  const suspendreUtilisateur = async (userId: number, raison: string) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`http://localhost:8000/api/admin/utilisateurs/${userId}/suspendre/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raison }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suspension');
      }

      await fetchUsers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suspension');
      return false;
    }
  };

  const reactiverUtilisateur = async (userId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`http://localhost:8000/api/admin/utilisateurs/${userId}/reactiver/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la réactivation');
      }

      await fetchUsers();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réactivation');
      return false;
    }
  };

  const getStats = (): AdminUserStats => {
    const stats: AdminUserStats = {
      total: users.length,
      parRole: {
        ADMIN: users.filter(u => u.role === 'ADMIN').length,
        GESTIONNAIRE: users.filter(u => u.role === 'GESTIONNAIRE').length,
        CHAUFFEUR: users.filter(u => u.role === 'CHAUFFEUR').length,
      },
      parStatut: {
        ACTIF: users.filter(u => u.statut === 'ACTIF').length,
        EN_ATTENTE: users.filter(u => u.statut === 'EN_ATTENTE').length,
        SUSPENDU: users.filter(u => u.statut === 'SUSPENDU').length,
      }
    };

    return stats;
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [currentUser]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    validerGestionnaire,
    suspendreUtilisateur,
    reactiverUtilisateur,
    stats: getStats(),
  };
};