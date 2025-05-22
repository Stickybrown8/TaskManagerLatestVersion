// === Ce fichier gère la page de connexion où les utilisateurs entrent leur email et mot de passe === /workspaces/TaskManagerLatestVersion/frontend/src/pages/Login.tsx
// Explication simple : C'est comme la porte d'entrée de l'application où tu dois donner ton nom et ton mot secret pour pouvoir entrer et utiliser l'app.
// Explication technique : Composant React fonctionnel qui gère l'authentification des utilisateurs avec gestion d'état local et global (Redux), animations (Framer Motion) et navigation programmatique.
// Utilisé dans : Le routeur principal de l'application, affiché quand l'utilisateur n'est pas connecté ou visite explicitement /login
// Connecté à : authService (API), authSlice et uiSlice (Redux), react-router pour la navigation

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import { authService } from '../services/api';
import { addNotification } from '../store/slices/uiSlice';
import { motion } from 'framer-motion';

// === Début : Composant principal de la page de connexion ===
// Explication simple : Cette fonction crée toute la page de connexion avec le formulaire et les boutons.
// Explication technique : Composant fonctionnel React qui encapsule la logique d'authentification et le rendu de l'interface utilisateur du formulaire de connexion.
const Login: React.FC = () => {
  // === Début : Configuration des hooks React et Redux ===
  // Explication simple : On prépare les outils spéciaux dont on a besoin pour faire fonctionner la page.
  // Explication technique : Initialisation du dispatcher Redux pour les actions d'état global et du hook de navigation pour les redirections.
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  // === Fin : Configuration des hooks React et Redux ===

  // === Début : États locaux du formulaire ===
  // Explication simple : Ce sont les boîtes qui vont contenir ce que l'utilisateur va taper (email, mot de passe) et si la page est en train de charger.
  // Explication technique : Déclaration des états React locaux avec useState pour gérer les entrées du formulaire et l'état de chargement.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // === Fin : États locaux du formulaire ===

  // === Début : Fonction de soumission du formulaire ===
  // Explication simple : Cette fonction s'occupe d'envoyer ton email et ton mot de passe au serveur quand tu cliques sur "Se connecter".
  // Explication technique : Fonction asynchrone qui gère la soumission du formulaire, avec validation des entrées, appel à l'API d'authentification, gestion des réponses et des erreurs, et navigation post-connexion.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      dispatch(addNotification({
        message: 'Veuillez remplir tous les champs',
        type: 'error'
      }));
      return;
    }

    try {
      setLoading(true);
      dispatch(loginStart());
      console.log('Tentative de connexion avec :', { email, password: '***' });

      const response = await authService.login(email, password);
      console.log('Réponse de connexion :', response);

      // ✅ CORRECTION - Structure de réponse alignée
      if (response.data && response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        dispatch(loginSuccess({ user: response.data.user, token: response.data.token }));
        dispatch(addNotification({
          message: 'Connexion réussie !',
          type: 'success'
        }));
        console.log('Redirection vers la page d\'accueil...');
        navigate('/'); // Redirige vers la page d'accueil privée
      } else {
        throw new Error("Identification échouée, veuillez vérifier vos identifiants.");
      }
    } catch (error: any) {
      console.error("Erreur complète:", error);
      dispatch(loginFailure(error.response?.data?.message || error.message || 'Erreur de connexion'));
      dispatch(addNotification({
        message: error.response?.data?.message || error.message || 'Erreur de connexion',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };
  // === Fin : Fonction de soumission du formulaire ===

  console.log("Login.tsx rendu !");

  // === Début : Rendu de l'interface utilisateur ===
  // Explication simple : C'est ce qui dessine la jolie page avec les cases où tu vas taper ton email et ton mot de passe.
  // Explication technique : Rendu JSX du composant avec animation d'entrée via Framer Motion, structuration responsive, gestion conditionnelle des états de chargement, et navigation vers l'inscription.
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Manager</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Connectez-vous pour gérer vos tâches</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="votre@email.com"
                required
                disabled={loading}
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
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
                required
                disabled={loading}
                onKeyDown={e => e.key === 'Enter' && handleSubmit(e as any)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vous n'avez pas de compte ?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                disabled={loading}
              >
                Créer un compte
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
  // === Fin : Rendu de l'interface utilisateur ===
};
// === Fin : Composant principal de la page de connexion ===

export default Login;
