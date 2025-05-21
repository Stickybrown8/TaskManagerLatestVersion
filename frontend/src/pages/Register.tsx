// === Ce fichier crée la page d'inscription qui permet aux nouveaux utilisateurs de créer un compte === /workspaces/TaskManagerLatestVersion/frontend/src/pages/Register.tsx
// Explication simple : C'est comme un formulaire d'inscription où tu remplis ton nom, ton email et ton mot de passe pour pouvoir utiliser l'application.
// Explication technique : Composant React fonctionnel qui gère le processus d'enregistrement des utilisateurs, avec validation des entrées, communication API et transitions animées avec Framer Motion.
// Utilisé dans : Le routeur principal de l'application, accessible directement via l'URL /register et par des liens depuis la page de connexion.
// Connecté à : API d'inscription backend via fetch, react-router-dom pour la navigation, et Framer Motion pour les animations.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// === Début : Composant principal Register ===
// Explication simple : Ce composant crée toute la page d'inscription avec son formulaire et ses animations.
// Explication technique : Composant fonctionnel React qui encapsule la logique d'inscription et la présentation du formulaire, avec gestion d'état local via useState.
const Register: React.FC = () => {
  // === Début : Configuration de la navigation et états du formulaire ===
  // Explication simple : On prépare les outils pour changer de page et pour stocker ce que l'utilisateur va taper.
  // Explication technique : Initialisation du hook useNavigate pour la redirection programmatique et déclaration des états React avec useState pour gérer les données du formulaire et ses états.
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // === Fin : Configuration de la navigation et états du formulaire ===

  // === Début : Fonction de soumission du formulaire ===
  // Explication simple : Cette fonction s'occupe d'envoyer tes informations au serveur quand tu cliques sur le bouton "S'inscrire".
  // Explication technique : Fonction asynchrone qui gère l'événement de soumission du formulaire, effectue la validation côté client, communique avec l'API via fetch, et gère les réponses et erreurs.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Tous les champs sont requis.');
      return;
    }

    setLoading(true);
    try {
      // Log pour debug en prod/déploiement
      console.log("REACT_APP_API_URL =", process.env.REACT_APP_API_URL);
      const apiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, ''); // supprime le slash de fin
      const url = `${apiUrl}/api/register`; // <-- ajoute /api
      console.log("URL d'inscription appelée :", url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Erreur lors de l'inscription");
      } else {
        // Inscription réussie, redirige vers login (ou auto-login selon logique de ton app)
        navigate('/login');
      }
    } catch (err) {
      setError("Erreur lors de la connexion au serveur");
    } finally {
      setLoading(false);
    }
  };
  // === Fin : Fonction de soumission du formulaire ===

  // === Début : Rendu de l'interface utilisateur ===
  // Explication simple : Cette partie dessine le formulaire sur l'écran avec les champs à remplir et le bouton d'inscription.
  // Explication technique : Rendu JSX du composant avec animations via Framer Motion, structure responsive avec Tailwind CSS, et gestion conditionnelle des états (erreur, chargement).
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Créer un compte</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Inscris-toi pour gérer tes tâches</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Votre nom"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="votre@email.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Inscription...' : "S'inscrire"}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Déjà un compte ?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
  // === Fin : Rendu de l'interface utilisateur ===
};
// === Fin : Composant principal Register ===

export default Register;
