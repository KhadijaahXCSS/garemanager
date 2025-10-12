
"use client"; // Nécessaire pour les hooks et les effets
import { useEffect, useState } from 'react';

interface Vehicule {
  vehicule_id: string;
  immatricule: string;
  type: string;
  chauffeur: {
    username: string;
  };
  date_enregistrement: string;
}

export default function ListeVehicules() {
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicules = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/vehicules/');
        if (!response.ok) {
          throw new Error('Échec de la récupération des données');
        }
        const data = await response.json();
        setVehicules(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicules();
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur : {error}</div>;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Liste des Véhicules</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">Immatricule</th>
              <th className="py-2 px-4 border">Type</th>
              <th className="py-2 px-4 border">Chauffeur</th>
              <th className="py-2 px-4 border">Date d'enregistrement</th>
            </tr>
          </thead>
          <tbody>
            {vehicules.map((vehicule) => (
              <tr key={vehicule.vehicule_id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border">{vehicule.immatricule}</td>
                <td className="py-2 px-4 border">{vehicule.type}</td>
                <td className="py-2 px-4 border">{vehicule.chauffeur.username}</td>
                <td className="py-2 px-4 border">
                  {new Date(vehicule.date_enregistrement).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}