// components/admin/Users/UserStats.tsx
'use client';

import { AdminUserStats } from '../../../hooks/useAdminUsers';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';

interface UserStatsProps {
  stats: AdminUserStats;
}

const UserStats = ({ stats }: UserStatsProps) => {
  const statCards = [
    {
      title: 'Total Utilisateurs',
      value: stats.total,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Utilisateurs Actifs',
      value: stats.parStatut.ACTIF,
      icon: UserCheck,
      color: 'green',
    },
    {
      title: 'En Attente',
      value: stats.parStatut.EN_ATTENTE,
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Suspendus',
      value: stats.parStatut.SUSPENDU,
      icon: UserX,
      color: 'red',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      red: 'bg-red-50 text-red-600 border-red-200',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <div
          key={stat.title}
          className={`p-6 rounded-lg border-2 ${getColorClasses(stat.color)}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{stat.title}</p>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
            </div>
            <stat.icon className="w-8 h-8 opacity-75" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserStats;