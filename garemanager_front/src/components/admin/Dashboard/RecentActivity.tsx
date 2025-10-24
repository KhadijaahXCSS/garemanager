// components/admin/Dashboard/RecentActivity.tsx
import React from 'react';
import { UserPlus, AlertTriangle, Car, Calendar } from 'lucide-react';

interface RecentActivityProps {
  activity: {
    nouvelles_inscriptions: any[];
    nouvelles_reclamations: any[];
    nouveaux_vehicules: any[];
  };
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activity }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'inscription':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'reclamation':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'vehicule':
        return <Car className="w-4 h-4 text-blue-500" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-500" />;
    }
  };

  const activities = [
    ...activity.nouvelles_inscriptions.map(item => ({
      type: 'inscription' as const,
      message: `Nouvel utilisateur: ${item.username} (${item.role})`,
      date: item.date_inscription,
      item
    })),
    ...activity.nouvelles_reclamations.map(item => ({
      type: 'reclamation' as const,
      message: `Nouvelle réclamation: ${item.titre}`,
      date: item.date_creation,
      item
    })),
    ...activity.nouveaux_vehicules.map(item => ({
      type: 'vehicule' as const,
      message: `Nouveau véhicule: ${item.immatricule}`,
      date: item.date_enregistrement,
      item
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 10); // Les 10 plus récentes

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Activité Récente</h2>
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune activité récente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Activité Récente</h2>
      
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {activity.message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(activity.date).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;