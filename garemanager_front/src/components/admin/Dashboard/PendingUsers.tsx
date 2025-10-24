// components/admin/Dashboard/PendingUsers.tsx
import React from 'react';
import { User, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import { useAdminDashboard } from '../../../hooks/useAdminDashboard';

interface PendingUsersProps {
  users: any[];
}

const PendingUsers: React.FC<PendingUsersProps> = ({ users }) => {
  const { validerUtilisateur, suspendreUtilisateur } = useAdminDashboard();

  const handleValider = async (userId: string, username: string) => {
    if (confirm(`Êtes-vous sûr de vouloir valider l'utilisateur "${username}" ?`)) {
      const success = await validerUtilisateur(userId);
      if (success) {
        alert('Utilisateur validé avec succès !');
      }
    }
  };

  const handleSuspendre = async (userId: string, username: string) => {
    const raison = prompt(`Raison de la suspension pour "${username}" :`);
    if (raison) {
      const success = await suspendreUtilisateur(userId, raison);
      if (success) {
        alert('Utilisateur suspendu avec succès !');
      }
    }
  };

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-blue-500" />
          Gestionnaires en Attente de Validation ({users.length})
        </h2>
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucun gestionnaire en attente de validation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <User className="w-5 h-5 mr-2 text-blue-500" />
        Utilisateurs en Attente ({users.length})
      </h2>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {users.map((user) => (
          <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="font-semibold text-gray-900">{user.username}</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    user.role === 'GESTIONNAIRE' 
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    <span>{user.telephone || 'Non renseigné'}</span>
                  </div>
                </div>
                
                {user.CIN && (
                  <div className="mt-2 text-sm text-gray-500">
                    CIN: {user.CIN}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => handleValider(user.id, user.username)}
                  className="flex items-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm transition-colors"
                  title="Valider l'utilisateur"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Valider
                </button>
                <button
                  onClick={() => handleSuspendre(user.id, user.username)}
                  className="flex items-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm transition-colors"
                  title="Suspendre l'utilisateur"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Refuser
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingUsers;