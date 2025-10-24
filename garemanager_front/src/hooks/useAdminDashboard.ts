// hooks/useAdminDashboard.ts
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface DashboardData {
  statistiques_globales: {
    total_utilisateurs: number;
    total_gares: number;
    total_vehicules: number;
    total_reclamations: number;
    reclamations_ouvertes: number;
    utilisateurs_en_attente: number;
  };
  utilisateurs_en_attente: any[];
  utilisateurs_suspendus: any[];
  reclamations_recentes: any[];
  activite_recente: {
    nouvelles_inscriptions: any[];
    nouvelles_reclamations: any[];
    nouveaux_vehicules: any[];
  };
  statistiques_gares: any[];
}

export const useAdminDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await axios.get<DashboardData>('http://localhost:8000/api/admin/dashboard/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const validerUtilisateur = async (userId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `http://localhost:8000/api/admin/utilisateurs/${userId}/valider_inscription/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Recharger les données après validation
      await fetchDashboardData();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la validation');
      return false;
    }
  };

  const suspendreUtilisateur = async (userId: string, raison: string) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `http://localhost:8000/api/admin/utilisateurs/${userId}/suspendre/`,
        { raison },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchDashboardData();
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la suspension');
      return false;
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData,
    validerUtilisateur,
    suspendreUtilisateur,
  };
};