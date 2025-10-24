'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  CIN: string;
  telephone: string;
}

interface Vehicule {
  vehicule_id: string;
  immatricule: string;
  type: string;
  date_enregistrement: string;
  statut?: 'ACTIF' | 'EN_ATTENTE' | 'REJETE';
}

interface NouveauVehicule {
  immatricule: string;
  type: string;
}

interface Gare {
  gare_id: string;
  nom: string;
  localisation: string;
  capacite_max: number;
  vehicules_actuels: number;
  places_disponibles: number;
  est_disponible: boolean;
  statut_demande: 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'NON_DEMANDE';
  date_demande?: string;
  date_traitement?: string;
}

interface Performance {
  note_moyenne: number;
  total_voyages: number;
  appreciation: string;
  bonnes_conduites: number;
  problemes_resolus: number;
}

interface FileAttente {
  position: number;
  vehicule_immatricule: string;
  heure_estimee: string;
  statut: string;
}

export default function ChauffeurDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [gares, setGares] = useState<Gare[]>([]);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [fileAttente, setFileAttente] = useState<FileAttente[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState('tableau-de-bord');
  const [loading, setLoading] = useState(true);
  const [showDeclarerVehicule, setShowDeclarerVehicule] = useState(false);
  const [nouveauVehicule, setNouveauVehicule] = useState<NouveauVehicule>({
    immatricule: '',
    type: 'NDIAGA'
  });
  const [loadingDeclarer, setLoadingDeclarer] = useState(false);
  const router = useRouter();
  const [showRechercherGares, setShowRechercherGares] = useState(false);
  const [garesDisponibles, setGaresDisponibles] = useState<Gare[]>([]);
  const [rechercheTerm, setRechercheTerm] = useState('');

  // Détection automatique du thème selon l'heure
  useEffect(() => {
    const heure = new Date().getHours();
    const nouveauTheme = (heure >= 18 || heure < 6) ? 'dark' : 'light';
    setTheme(nouveauTheme);
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');

    if (!userData || !token) {
      router.push('/login');
      return;
    }

    const userObj = JSON.parse(userData);
    if (userObj.role !== 'CHAUFFEUR') {
      router.push('/login');
      return;
    }

    setUser(userObj);
    chargerDonneesChauffeur();
  }, [router]);

 
// Fonction pour charger TOUTES les gares avec leur disponibilité
const chargerGaresDisponibles = async () => {
  try {
    const token = localStorage.getItem('access_token');
    // Utilisez le nouvel endpoint ou modifiez l'existant
    const response = await fetch('http://localhost:8000/api/gares/gares_avec_disponibilite/', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const garesAvecDisponibilite = await response.json();
      setGaresDisponibles(garesAvecDisponibilite);
    } else {
      // Fallback: utiliser l'endpoint normal si le nouveau n'existe pas encore
      const responseNormal = await fetch('http://localhost:8000/api/gares/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (responseNormal.ok) {
        const toutesLesGares = await responseNormal.json();
        // Pour l'instant, marquer toutes les gares comme disponibles
        const garesAvecDisponibilite = toutesLesGares.map((gare: any) => ({
          ...gare,
          capacite_max: gare.capacite_max || 50, // Valeur par défaut
          vehicules_actuels: 0, // À implémenter avec la logique réelle
          places_disponibles: gare.capacite_max || 50,
          est_disponible: true // Temporairement true en attendant la logique réelle
        }));
        setGaresDisponibles(garesAvecDisponibilite);
      }
    }
  } catch (error) {
    console.error('Erreur chargement gares disponibles:', error);
  }
};

  // Fonctions pour gérer les demandes d'accès
  const annulerDemande = async (gareId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/chauffeur/retirer-demande-acces/${gareId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await chargerDonneesChauffeur();
        await chargerGaresDisponibles(); // Recharger les gares disponibles
        alert('Demande annulée avec succès !');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de l\'annulation de la demande');
      }
    } catch (error) {
      console.error('Erreur annulation demande:', error);
      alert('Erreur lors de l\'annulation de la demande');
    }
  };

  const quitterGare = async (gareId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir quitter cette gare ? Cette action est définitive.')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/gares/${gareId}/quitter-gare/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await chargerDonneesChauffeur();
        await chargerGaresDisponibles(); // Recharger les gares disponibles
        alert('Vous avez quitté la gare avec succès !');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la sortie de la gare');
      }
    } catch (error) {
      console.error('Erreur sortie gare:', error);
      alert('Erreur lors de la sortie de la gare');
    }
  };

  // Ouvrir la modal de recherche
  const ouvrirRechercheGares = () => {
    setShowRechercherGares(true);
    chargerGaresDisponibles();
  };

  const chargerDonneesChauffeur = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Charger les véhicules du chauffeur
      try {
        const vehiculesResponse = await fetch('http://localhost:8000/api/vehicules/mes-vehicules/', {
          headers
        });
        
        if (vehiculesResponse.ok) {
          const vehiculesData = await vehiculesResponse.json();
          setVehicules(vehiculesData);
        } else {
          // Fallback: utiliser l'endpoint normal
          const allVehiculesResponse = await fetch('http://localhost:8000/api/vehicules/', {
            headers
          });
          if (allVehiculesResponse.ok) {
            const allVehiculesData = await allVehiculesResponse.json();
            setVehicules(allVehiculesData);
          }
        }
      } catch (error) {
        console.error('Erreur chargement véhicules:', error);
      }

      // Charger les gares du chauffeur
      try {
        const garesResponse = await fetch('http://localhost:8000/api/chauffeur/mes-gares/', {
          headers
        });
        
        if (garesResponse.ok) {
          const garesData = await garesResponse.json();
          setGares(garesData);
        }
      } catch (error) {
        console.error('Erreur chargement gares:', error);
      }

      // Charger les performances
      try {
        const performanceResponse = await fetch('http://localhost:8000/api/chauffeur/performance/', {
          headers
        });
        
        if (performanceResponse.ok) {
          const performanceData = await performanceResponse.json();
          setPerformance(performanceData);
        }
      } catch (error) {
        console.error('Erreur chargement performance:', error);
      }

      // Charger la file d'attente actuelle
      try {
        const fileAttenteResponse = await fetch('http://localhost:8000/api/files-attente/', {
          headers
        });
        
        if (fileAttenteResponse.ok) {
          const fileAttenteData = await fileAttenteResponse.json();
          setFileAttente(fileAttenteData);
        }
      } catch (error) {
        console.error('Erreur chargement file attente:', error);
      }

    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const demanderAccesGare = async (gareId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/gares/${gareId}/demander-acces/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Recharger les données des gares
        await chargerDonneesChauffeur();
        await chargerGaresDisponibles(); // Recharger aussi les gares disponibles
        alert('Demande d\'accès envoyée avec succès !');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de l\'envoi de la demande');
      }
    } catch (error) {
      console.error('Erreur demande accès:', error);
      alert('Erreur lors de l\'envoi de la demande');
    }
  };

  const declarerVehicule = async () => {
    if (!nouveauVehicule.immatricule.trim()) {
      alert('Veuillez saisir le numéro d\'immatriculation');
      return;
    }

    try {
      setLoadingDeclarer(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('http://localhost:8000/api/vehicules/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          immatricule: nouveauVehicule.immatricule.toUpperCase().trim(),
          type: nouveauVehicule.type
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Recharger la liste des véhicules
        await chargerDonneesChauffeur();
        setShowDeclarerVehicule(false);
        setNouveauVehicule({ immatricule: '', type: 'NDIAGA' });
        alert('Véhicule déclaré avec succès !');
      } else {
        // Afficher l'erreur spécifique du backend
        const errorMessage = data.error || data.immatricule || 'Erreur lors de la déclaration';
        alert(`Erreur: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Erreur déclaration véhicule:', error);
      alert('Erreur de connexion lors de la déclaration du véhicule');
    } finally {
      setLoadingDeclarer(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getCurrentVehiculePosition = () => {
    if (!user || !fileAttente.length) return null;
    
    // Trouver la position du chauffeur dans la file d'attente
    const currentPosition = fileAttente.find(item => 
      vehicules.some(v => v.immatricule === item.vehicule_immatricule)
    );
    
    return currentPosition?.position || null;
  };

  if (!user || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  const currentPosition = getCurrentVehiculePosition();

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <header
        className={`shadow-lg ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div
                className={`p-2 rounded-lg ${
                  theme === "dark" ? "bg-blue-600" : "bg-blue-100"
                }`}
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h4a1 1 0 001-1v-1h1a1 1 0 001-1V5a1 1 0 00-1-1H3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dashboard Chauffeur</h1>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Bienvenue, {user.username}!
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  theme === "dark"
                    ? "bg-orange-900 text-orange-200"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                CHAUFFEUR
              </div>

              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-150"
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-4">
            <div className="flex space-x-8">
              {[
                { id: "tableau-de-bord", label: "Tableau de Bord" },
                { id: "vehicules", label: "Mes Véhicules" },
                { id: "gares", label: "Gares" },
                { id: "performance", label: "Performance" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : `border-transparent ${
                          theme === "dark"
                            ? "text-gray-400 hover:text-gray-300"
                            : "text-gray-500 hover:text-gray-700"
                        }`
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tableau de Bord */}
        {activeTab === "tableau-de-bord" && (
          <div className="space-y-6">
            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className={`p-6 rounded-lg shadow ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`p-3 rounded-full ${
                      theme === "dark" ? "bg-blue-900" : "bg-blue-100"
                    }`}
                  >
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Prochain Départ
                    </p>
                    <p className="text-2xl font-semibold">
                      {fileAttente[0]?.heure_estimee || "--:--"}
                    </p>
                    <p className="text-sm text-green-600">
                      {fileAttente[0] ? "Gare Active" : "Aucun départ"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-6 rounded-lg shadow ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`p-3 rounded-full ${
                      theme === "dark" ? "bg-green-900" : "bg-green-100"
                    }`}
                  >
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Position Actuelle
                    </p>
                    <p className="text-2xl font-semibold">
                      {currentPosition ? `#${currentPosition}` : "--"}
                    </p>
                    <p className="text-sm text-blue-600">
                      {currentPosition ? "Dans la file" : "Hors file"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-6 rounded-lg shadow ${
                  theme === "dark" ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`p-3 rounded-full ${
                      theme === "dark" ? "bg-purple-900" : "bg-purple-100"
                    }`}
                  >
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Note Moyenne
                    </p>
                    <p className="text-2xl font-semibold">
                      {performance?.note_moyenne
                        ? `${performance.note_moyenne}/5`
                        : "--/5"}
                    </p>
                    <p className="text-sm text-yellow-600">
                      {performance?.appreciation || "Aucune évaluation"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* File d'attente actuelle */}
            <div
              className={`rounded-lg shadow ${
                theme === "dark" ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold">File d'Attente</h2>
              </div>
              <div className="p-6">
                {fileAttente.length > 0 ? (
                  <div className="space-y-3">
                    {fileAttente.map((item, index) => {
                      const isCurrent = vehicules.some(
                        (v) => v.immatricule === item.vehicule_immatricule
                      );
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            isCurrent
                              ? "bg-blue-100 border border-blue-300"
                              : theme === "dark"
                              ? "bg-gray-700"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCurrent
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-300 text-gray-600"
                              }`}
                            >
                              {item.position}
                            </div>
                            <div>
                              <p className="font-medium">
                                {item.vehicule_immatricule}
                              </p>
                              <p
                                className={`text-sm ${
                                  theme === "dark"
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }`}
                              >
                                {item.heure_estimee}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.statut === "En cours"
                                ? "bg-green-100 text-green-800"
                                : isCurrent
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {isCurrent ? "Votre tour" : item.statut}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p
                      className={`${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Aucune file d'attente active
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mes Véhicules */}
        {activeTab === "vehicules" && (
          <div
            className={`rounded-lg shadow ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Mes Véhicules</h2>
              <button
                onClick={() => setShowDeclarerVehicule(true)}
                disabled={vehicules.length >= 3}
                className={`px-4 py-2 rounded-md ${
                  vehicules.length >= 3
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
              >
                Déclarer un Véhicule ({vehicules.length}/3)
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicules.map((vehicule) => (
                  <div
                    key={vehicule.vehicule_id}
                    className={`border rounded-lg p-4 ${
                      theme === "dark"
                        ? "border-gray-700 bg-gray-700"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg">
                        {vehicule.immatricule}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          "bg-green-100 text-green-800" // Statut toujours actif pour l'instant
                        }`}
                      >
                        ACTIF
                      </span>
                    </div>
                    <p
                      className={`mb-2 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Type: {vehicule.type}
                    </p>
                    <p
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Enregistré le:{" "}
                      {new Date(
                        vehicule.date_enregistrement
                      ).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
              {vehicules.length === 0 && (
                <div className="text-center py-8">
                  <p
                    className={`${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Aucun véhicule déclaré. Cliquez sur "Déclarer un Véhicule"
                    pour commencer.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gares */}
        {activeTab === "gares" && (
          <div
            className={`rounded-lg shadow ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Mes Gares</h2>
              {gares.filter(
                (g) =>
                  g.statut_demande === "ACCEPTEE" ||
                  g.statut_demande === "EN_ATTENTE"
              ).length < 2 && (
                <button
                  onClick={() => setShowRechercherGares(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Rechercher des Gares
                </button>
              )}
            </div>
            <div className="p-6">
              {/* Compteur de gares */}
              <div
                className={`mb-6 p-4 rounded-lg ${
                  theme === "dark"
                    ? "bg-blue-900 text-blue-200"
                    : "bg-blue-50 text-blue-800"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Statut des gares:</span>
                  <span>
                    {
                      gares.filter((g) => g.statut_demande === "ACCEPTEE")
                        .length
                    }{" "}
                    gare(s) active(s) •
                    {
                      gares.filter((g) => g.statut_demande === "EN_ATTENTE")
                        .length
                    }{" "}
                    demande(s) en attente •
                    {2 -
                      gares.filter(
                        (g) =>
                          g.statut_demande === "ACCEPTEE" ||
                          g.statut_demande === "EN_ATTENTE"
                      ).length}{" "}
                    place(s) disponible(s)
                  </span>
                </div>
              </div>

              {/* Gares acceptées */}
              <div className="mb-8">
                <h3 className="text-md font-semibold mb-4 text-green-600">
                  Gares Actives (
                  {gares.filter((g) => g.statut_demande === "ACCEPTEE").length})
                </h3>
                <div className="space-y-4">
                  {gares
                    .filter((g) => g.statut_demande === "ACCEPTEE")
                    .map((gare) => (
                      <div
                        key={gare.gare_id}
                        className="border border-green-200 rounded-lg p-4 bg-green-50"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {gare.nom}
                            </h3>
                            <p className="text-gray-600">{gare.localisation}</p>
                            {gare.date_demande && (
                              <p className="text-sm text-gray-500">
                                Membre depuis:{" "}
                                {new Date(
                                  gare.date_demande
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                              ✓ Accès autorisé
                            </span>
                            <button
                              onClick={() => quitterGare(gare.gare_id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                              title="Quitter cette gare après 3 mois de travail"
                            >
                              Quitter
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {gares.filter((g) => g.statut_demande === "ACCEPTEE")
                    .length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      Aucune gare active
                    </p>
                  )}
                </div>
              </div>

              {/* Demandes en attente */}
              <div className="mb-8">
                <h3 className="text-md font-semibold mb-4 text-yellow-600">
                  Demandes en Attente (
                  {
                    gares.filter((g) => g.statut_demande === "EN_ATTENTE")
                      .length
                  }
                  )
                </h3>
                <div className="space-y-4">
                  {gares
                    .filter((g) => g.statut_demande === "EN_ATTENTE")
                    .map((gare) => (
                      <div
                        key={gare.gare_id}
                        className="border border-yellow-200 rounded-lg p-4 bg-yellow-50"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">
                              {gare.nom}
                            </h3>
                            <p className="text-gray-600">{gare.localisation}</p>
                            {gare.date_demande && (
                              <p className="text-sm text-gray-500">
                                Demandé le:{" "}
                                {new Date(
                                  gare.date_demande
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                              ⏳ En attente
                            </span>
                            <button
                              onClick={() => annulerDemande(gare.gare_id)}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {gares.filter((g) => g.statut_demande === "EN_ATTENTE")
                    .length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      Aucune demande en attente
                    </p>
                  )}
                </div>
              </div>

              {/* Demandes refusées */}
              {gares.filter((g) => g.statut_demande === "REFUSEE").length >
                0 && (
                <div className="mb-8">
                  <h3 className="text-md font-semibold mb-4 text-red-600">
                    Demandes Refusées (
                    {gares.filter((g) => g.statut_demande === "REFUSEE").length}
                    )
                  </h3>
                  <div className="space-y-4">
                    {gares
                      .filter((g) => g.statut_demande === "REFUSEE")
                      .map((gare) => (
                        <div
                          key={gare.gare_id}
                          className="border border-red-200 rounded-lg p-4 bg-red-50"
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                {gare.nom}
                              </h3>
                              <p className="text-gray-600">
                                {gare.localisation}
                              </p>
                              {gare.date_demande && (
                                <p className="text-sm text-gray-500">
                                  Demandé le:{" "}
                                  {new Date(
                                    gare.date_demande
                                  ).toLocaleDateString()}
                                </p>
                              )}
                              {gare.date_traitement && (
                                <p className="text-sm text-gray-500">
                                  Refusé le:{" "}
                                  {new Date(
                                    gare.date_traitement
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                              ✗ Refusé
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            <div
              className={`rounded-lg shadow ${
                theme === "dark" ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Mes Performances</h2>
              </div>
              <div className="p-6">
                {performance ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-4">
                        Statistiques Générales
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Note Moyenne</span>
                          <span className="font-semibold">
                            {performance.note_moyenne}/5
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Voyages</span>
                          <span className="font-semibold">
                            {performance.total_voyages}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bonnes Conduites</span>
                          <span className="font-semibold text-green-600">
                            {performance.bonnes_conduites}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Problèmes Résolus</span>
                          <span className="font-semibold text-blue-600">
                            {performance.problemes_resolus}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Appréciation</h3>
                      <div
                        className={`p-4 rounded-lg ${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                        }`}
                      >
                        <p className="italic">"{performance.appreciation}"</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p
                      className={`${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Aucune donnée de performance disponible
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de déclaration de véhicule */}
      {showDeclarerVehicule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h3 className="text-lg font-semibold mb-4">
              Déclarer un nouveau véhicule
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Immatriculation
                </label>
                <input
                  type="text"
                  value={nouveauVehicule.immatricule}
                  onChange={(e) =>
                    setNouveauVehicule({
                      ...nouveauVehicule,
                      immatricule: e.target.value,
                    })
                  }
                  placeholder="Ex: DK-1234-AB"
                  className={`w-full p-2 border rounded-md ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Type de véhicule
                </label>
                <select
                  value={nouveauVehicule.type}
                  onChange={(e) =>
                    setNouveauVehicule({
                      ...nouveauVehicule,
                      type: e.target.value,
                    })
                  }
                  className={`w-full p-2 border rounded-md ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                >
                  <option value="NDIAGA">Ndiaga Ndiaye</option>
                  <option value="CLANDO">Clando</option>
                  <option value="MINI_CAR">Mini-car</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowDeclarerVehicule(false);
                  setNouveauVehicule({ immatricule: "", type: "NDIAGA" });
                }}
                className={`px-4 py-2 rounded-md ${
                  theme === "dark"
                    ? "bg-gray-600 hover:bg-gray-500"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              >
                Annuler
              </button>
              <button
                onClick={declarerVehicule}
                disabled={
                  loadingDeclarer || !nouveauVehicule.immatricule.trim()
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loadingDeclarer ? "Enregistrement..." : "Déclarer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de recherche de gares - CORRIGÉ */}
      {showRechercherGares && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">Toutes les Gares</h3>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {garesDisponibles.length} gare(s) disponible(s)
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRechercherGares(false);
                  setRechercheTerm("");
                }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Rechercher une gare par nom ou localisation..."
                value={rechercheTerm}
                onChange={(e) => setRechercheTerm(e.target.value)}
                className={`w-full p-2 border rounded-md ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>

            {/* Liste des gares disponibles */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-3">
                {garesDisponibles
                  .filter(
                    (gare) =>
                      gare.nom
                        .toLowerCase()
                        .includes(rechercheTerm.toLowerCase()) ||
                      gare.localisation
                        .toLowerCase()
                        .includes(rechercheTerm.toLowerCase())
                  )
                  .map((gare) => {
                    // Trouver le statut actuel de cette gare
                    const statutActuel =
                      gares.find((g) => g.gare_id === gare.gare_id)
                        ?.statut_demande || "NON_DEMANDE";

                    return (
                      <div
                        key={gare.gare_id}
                        className={`border rounded-lg p-4 ${
                          theme === "dark"
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-200 bg-white"
                        } ${!gare.est_disponible ? "opacity-60" : ""}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {gare.nom}
                                </h3>
                                <p
                                  className={
                                    theme === "dark"
                                      ? "text-gray-300"
                                      : "text-gray-600"
                                  }
                                >
                                  📍 {gare.localisation}
                                </p>
                              </div>
                              {!gare.est_disponible && (
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium ml-2">
                                  COMPLET
                                </span>
                              )}
                            </div>

                            {/* Informations de capacité */}
                            <div
                              className={`mt-2 p-2 rounded text-xs ${
                                theme === "dark" ? "bg-gray-600" : "bg-gray-100"
                              }`}
                            >
                              <div className="flex justify-between">
                                <span>Capacité:</span>
                                <span>
                                  {gare.vehicules_actuels}/{gare.capacite_max}{" "}
                                  véhicules
                                </span>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span>Places disponibles:</span>
                                <span
                                  className={
                                    gare.places_disponibles > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {gare.places_disponibles}
                                </span>
                              </div>
                            </div>

                            {/* Statut de demande */}
                            <p
                              className={`text-sm mt-2 ${
                                statutActuel === "ACCEPTEE"
                                  ? "text-green-500"
                                  : statutActuel === "EN_ATTENTE"
                                  ? "text-yellow-500"
                                  : statutActuel === "REFUSEE"
                                  ? "text-red-500"
                                  : "text-gray-500"
                              }`}
                            >
                              Statut:{" "}
                              {statutActuel === "ACCEPTEE"
                                ? "✅ Accès autorisé"
                                : statutActuel === "EN_ATTENTE"
                                ? "⏳ Demande en attente"
                                : statutActuel === "REFUSEE"
                                ? "❌ Demande refusée"
                                : "🔓 Non demandé"}
                            </p>
                          </div>

                          <div className="flex flex-col items-end space-y-2 ml-4">
                            {statutActuel === "NON_DEMANDE" && (
                              <button
                                onClick={() => demanderAccesGare(gare.gare_id)}
                                disabled={!gare.est_disponible}
                                className={`px-4 py-2 rounded-md text-sm ${
                                  gare.est_disponible
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                                }`}
                              >
                                {gare.est_disponible
                                  ? "Demander Accès"
                                  : "Complet"}
                              </button>
                            )}
                            {statutActuel === "EN_ATTENTE" && (
                              <button
                                onClick={() => annulerDemande(gare.gare_id)}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm"
                              >
                                Annuler Demande
                              </button>
                            )}
                            {statutActuel === "ACCEPTEE" && (
                              <button
                                onClick={() => quitterGare(gare.gare_id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
                              >
                                Quitter Gare
                              </button>
                            )}
                            {statutActuel === "REFUSEE" && (
                              <button
                                onClick={() => demanderAccesGare(gare.gare_id)}
                                disabled={!gare.est_disponible}
                                className={`px-4 py-2 rounded-md text-sm ${
                                  gare.est_disponible
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                                }`}
                              >
                                {gare.est_disponible ? "Redemander" : "Complet"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Information */}
            <div
              className={`mt-4 p-3 rounded text-sm ${
                theme === "dark"
                  ? "bg-blue-900 text-blue-200"
                  : "bg-blue-50 text-blue-800"
              }`}
            >
              <p className="font-semibold mb-1">Légende :</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>🔓 Non demandé</div>
                <div>⏳ En attente</div>
                <div>✅ Accès autorisé</div>
                <div>❌ Demande refusée</div>
                <div>🔴 Gare complète</div>
                <div>🟢 Places disponibles</div>
              </div>
              <p className="mt-2">
                💡 Vous pouvez demander l'accès à maximum 2 gares simultanément.
              </p>
              <p className="mt-1">
                📊 La disponibilité est calculée en temps réel selon la capacité
                de la gare.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}