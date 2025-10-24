// app/admin/utilisateurs/page.tsx
'use client';

import { useState } from 'react';
import { useAdminUsers } from '../../../hooks/useAdminUsers';
import UserStats from '../../../components/admin/Users/UserStats';
import UsersTable from '../../../components/admin/Users/UsersTable';
import UserFilters from '../../../components/admin/Users/UserFilters';

export default function AdminUsersPage() {
  const { users, loading, error, refetch, stats, validerGestionnaire, suspendreUtilisateur, reactiverUtilisateur } = useAdminUsers();
  const [filters, setFilters] = useState({
    role: '',
    statut: '',
    search: '',
  });

  const filteredUsers = users.filter(user => {
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesStatut = !filters.statut || user.statut === filters.statut;
    const matchesSearch = !filters.search || 
      user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      (user.CIN && user.CIN.toLowerCase().includes(filters.search.toLowerCase()));

    return matchesRole && matchesStatut && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="text-red-500 mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800">Erreur</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-gray-600 mt-2">
            Gérez tous les utilisateurs de la plateforme
          </p>
        </div>
        <button
          onClick={refetch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* Statistiques */}
      <UserStats stats={stats} />

      {/* Filtres */}
      <UserFilters filters={filters} onFiltersChange={setFilters} />

      {/* Tableau des utilisateurs */}
      <UsersTable
        users={filteredUsers}
        onValiderGestionnaire={validerGestionnaire}
        onSuspendreUtilisateur={suspendreUtilisateur}
        onReactiverUtilisateur={reactiverUtilisateur}
      />
    </div>
  );
}