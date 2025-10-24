// components/admin/Dashboard/RecentReclamations.tsx
import React from 'react';
import { AlertTriangle, User, MapPin, Calendar } from 'lucide-react';

interface RecentReclamationsProps {
  reclamations: any[];
}

const RecentReclamations: React.FC<RecentReclamationsProps> = ({ reclamations }) => {
  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'OUVERTE':
        return 'bg-red-100 text-red-800';
      case 'EN_COURS':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLUE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CONFLIT':
        return 'border-red-300 bg-red-50';
      case 'SERVICE':
        return 'border-blue-300 bg-blue-50';
      case 'COMPORTEMENT':
        return 'border-orange-300 bg-orange-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  if (reclamations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
          Réclamations Récentes
        </h2>
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune réclamation récente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
        Réclamations Récentes ({reclamations.length})
      </h2>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {reclamations.map((reclamation) => (
          <div 
            key={reclamation.reclamation_id}
            className={`border-l-4 rounded-r-lg p-4 ${getTypeColor(reclamation.type)}`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{reclamation.titre}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(reclamation.statut)}`}>
                {reclamation.statut_display}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {reclamation.description}
            </p>
            
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                <span>{reclamation.chauffeur_detail?.username}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{reclamation.gare_detail?.nom}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{new Date(reclamation.date_creation).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            
            <div className="mt-2">
              <span className="inline-block px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                {reclamation.type_display}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentReclamations;