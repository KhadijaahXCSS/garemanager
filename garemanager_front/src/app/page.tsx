
'use client';
import { useState, useEffect } from 'react';

import Link from 'next/link';

export default function Home() {
  const [activeSection, setActiveSection] = useState('accueil');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  // Vérifie l'état de connexion au chargement
  useEffect(() => { 
    const token = localStorage.getItem('token');
    if (token) {
      // Décoder le JWT pour obtenir le username (vous aurez besoin de jwt-decode)
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setUsername(decoded.username);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUsername('');
    window.location.href = '/';
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(sectionId);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#333] font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 bg-white shadow-md z-10">
    <div className="container mx-auto px-6 py-3 flex justify-between items-center">
      <div className="text-xl font-bold text-[#2c3e50]">GareManager</div>
      <div className="flex space-x-8">
        {['accueil', 'apropos', 'services', 'contact'].map((item) => (
          <button
            key={item}
            onClick={() => scrollToSection(item)}
            className={`py-2 px-1 ${activeSection === item ? 'border-b-2 border-[#3498db] text-[#3498db]' : 'text-[#2c3e50] hover:text-[#3498db]'}`}
          >
            {item.charAt(0).toUpperCase() + item.slice(1).replace('contact', 'Notre Carte')}
          </button>
        ))}
        
        {isLoggedIn ? (
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Bonjour, {username}</span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Déconnexion
            </button>
          </div>
        ) : (
          <Link 
            href="auth/login" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Connexion/Inscription
          </Link>
        )}
      </div>
    </div>
  </nav>

      {/* Hero Section */}
      <section id="accueil" className="py-20 bg-gradient-to-r from-[#3498db] to-[#2c3e50] text-white">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">OPTIMISEZ VOTRE GARE ROUTIÈRE</h1>
          <p className="text-xl mb-8">Solution complète de gestion des véhicules et files d'attente</p>
          <button 
            onClick={() => scrollToSection('services')}
            className="bg-white text-[#2c3e50] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition"
          >
            Découvrir nos services
          </button>
        </div>
      </section>

      {/* À Propos Section */}
      <section id="apropos" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#2c3e50]">À PROPOS DE NOUS</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg mb-6">
                GareManager révolutionne la gestion des gares routières avec une solution tout-en-un intuitive et performante.
              </p>
              <p className="text-lg">
                Notre plateforme permet un suivi en temps réel des véhicules, une optimisation des files d'attente et des statistiques précises.
              </p>
            </div>
            <div className="bg-[#f5f5f5] p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 text-[#3498db]">Nos chiffres clés</h3>
              <div className="grid grid-cols-2 gap-4">
                {['50+ Gares', '1000+ Véhicules', '24/7 Support', '95% Satisfaction'].map((item) => (
                  <div key={item} className="bg-white p-4 rounded text-center shadow-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-[#f5f5f5]">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#2c3e50]">NOS SERVICES</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Gestion des véhicules",
                desc: "Suivi complet des immatriculations, types et chauffeurs"
              },
              {
                title: "Files d'attente",
                desc: "Optimisation dynamique des positions et statuts"
              },
              {
                title: "Statistiques",
                desc: "Analyses temps réel et rapports personnalisés"
              }
            ].map((service, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="text-4xl mb-4 text-[#3498db]">0{index + 1}</div>
                <h3 className="text-xl font-bold mb-3 text-[#2c3e50]">{service.title}</h3>
                <p className="text-gray-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carte de Visite (Permis) Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#2c3e50]">NOTRE CARTE DE VISITE</h2>
          <div className="max-w-md mx-auto bg-[#f5f5f5] p-8 rounded-xl shadow-lg border-2 border-[#3498db]">
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto bg-[#3498db] rounded-full flex items-center justify-center text-white text-4xl font-bold">GM</div>
            </div>
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="font-bold text-[#2c3e50]">GareManager</h3>
                <p className="text-gray-600">Solution de gestion routière</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Depuis</p>
                  <p>2025</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p>contact@garemanager.com</p>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-sm text-gray-500 text-center">"Optimiser chaque mouvement"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2c3e50] text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p>© 2025 GareManager. Tous droits réservés.</p>
          <div className="flex justify-center space-x-6 mt-4">
            <a href="#" className="hover:text-[#3498db]">Mentions légales</a>
            <a href="#" className="hover:text-[#3498db]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}