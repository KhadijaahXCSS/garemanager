import ListeVehicules from '@/components/ListeVehicules';

export default function vehicule() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Bienvenue sur GareManager</h1>
      <ListeVehicules />
    </div>
  );
}