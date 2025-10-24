// components/admin/Users/UsersTable.tsx
'use client';

import { useState } from 'react';
import { Utilisateur } from '../../../hooks/useAdminUsers';
import { MoreVertical, Check, X, Ban, RotateCcw, Mail, Phone, IdCard, Users } from 'lucide-react';

interface UsersTableProps {
  users: Utilisateur[];
  onValiderGestionnaire: (userId: number) => Promise<boolean>;
  onSuspendreUtilisateur: (userId: number, raison: string) => Promise<boolean>;
  onReactiverUtilisateur: (userId: number) => Promise<boolean>;
}

const UsersTable = ({ users, onValiderGestionnaire, onSuspendreUtilisateur, onReactiverUtilisateur }: UsersTableProps) => {
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [showSuspensionModal, setShowSuspensionModal] = useState<number | null>(null);

  const getRoleColor = (role: string) => {
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      GESTIONNAIRE: 'bg-blue-100 text-blue-800',
      CHAUFFEUR: 'bg-green-100 text-green-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (statut: string) => {
    const colors = {
      ACTIF: 'bg-green-100 text-green-800',
      EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
      SUSPENDU: 'bg-red-100 text-red-800',
      DESACTIVE: 'bg-gray-100 text-gray-800',
    };
    return colors[statut as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleSuspendre = async (userId: number) => {
    if (!suspensionReason.trim()) {
      alert('Veuillez saisir une raison de suspension');
      return;
    }

    const success = await onSuspendreUtilisateur(userId, suspensionReason);
    if (success) {
      setShowSuspensionModal(null);
      setSuspensionReason('');
      setActiveMenu(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date d'inscription
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.username}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 space-y-1">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {user.email}
                      </div>
                      {user.telephone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {user.telephone}
                        </div>
                      )}
                      {user.CIN && (
                        <div className="flex items-center">
                          <IdCard className="w-4 h-4 mr-2 text-gray-400" />
                          {user.CIN}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.statut)}`}>
                      {user.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.date_inscription)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {activeMenu === user.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                        <div className="py-1">
                          {/* Validation gestionnaire */}
                          {user.role === 'GESTIONNAIRE' && user.statut === 'EN_ATTENTE' && (
                            <button
                              onClick={() => onValiderGestionnaire(user.id)}
                              className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Valider
                            </button>
                          )}

                          {/* Suspension */}
                          {user.statut !== 'SUSPENDU' && (
                            <button
                              onClick={() => setShowSuspensionModal(user.id)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Suspendre
                            </button>
                          )}

                          {/* Réactivation */}
                          {user.statut === 'SUSPENDU' && (
                            <button
                              onClick={() => onReactiverUtilisateur(user.id)}
                              className="flex items-center w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Réactiver
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>

      {/* Modal de suspension */}
      {showSuspensionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Suspendre l'utilisateur</h3>
            <textarea
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="Raison de la suspension..."
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSuspensionModal(null);
                  setSuspensionReason('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleSuspendre(showSuspensionModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Confirmer la suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UsersTable;