/*
 * EN-TÊTE DE L'APPLICATION (VERSION AMÉLIORÉE) - frontend/src/components/HeaderUpdated.tsx
 *
 * Explication simple:
 * Ce fichier crée la barre supérieure améliorée de l'application que tu vois sur toutes les pages.
 * Cette barre contient le titre "Task Manager", un compteur de points et de badges pour 
 * motiver l'utilisateur, un bouton pour passer en mode nuit/jour, l'avatar de l'utilisateur
 * et un bouton pour se déconnecter. Cette version utilise un composant DarkModeToggle séparé
 * pour mieux organiser le code et faciliter la maintenance.
 *
 * Explication technique:
 * Composant React fonctionnel qui constitue l'en-tête global optimisé de l'application, affichant
 * le branding, les éléments de gamification, un toggle de thème modulaire et les contrôles utilisateur.
 * Il consomme le store Redux pour accéder aux états d'authentification et de gamification.
 *
 * Où ce fichier est utilisé:
 * Intégré dans le layout principal de l'application comme alternative au Header standard,
 * affiché en haut de chaque page une fois que l'utilisateur est authentifié.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise le hook useAppSelector depuis '../hooks' pour accéder au store
 * - Importe le composant DarkModeToggle depuis './DarkModeToggle'
 * - Utilise les types définis dans '../store'
 * - Reçoit une fonction onLogout du composant parent pour gérer la déconnexion
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour construire notre barre d'en-tête, comme quand tu rassembles tes crayons et règles avant de dessiner.
// Explication technique : Importation de React, du hook personnalisé pour accéder au store Redux, des types TypeScript nécessaires et du composant modulaire de bascule du thème.
import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { RootState, AuthState, GamificationState } from '../store/index';
import { toggleTimerPopup } from '../store/slices/timerSlice';
import DarkModeToggle from './DarkModeToggle';
// === Fin : Importation des dépendances ===

// === Début : Définition de l'interface des props ===
// Explication simple : On explique à l'ordinateur ce que notre barre d'en-tête a besoin pour fonctionner correctement, comme une liste d'ingrédients pour une recette.
// Explication technique : Déclaration d'une interface TypeScript qui définit les propriétés attendues par le composant, spécifiquement la fonction callback pour la déconnexion.
interface HeaderProps {
  onLogout: () => void;
}
// === Fin : Définition de l'interface des props ===

// === Début : Composant principal HeaderUpdated ===
// Explication simple : On commence à construire notre barre d'en-tête améliorée avec tous ses éléments.
// Explication technique : Définition du composant fonctionnel React avec typage explicite des props via l'interface HeaderProps, destructurant la fonction onLogout.
const HeaderUpdated: React.FC<HeaderProps> = ({ onLogout }) => {
// === Fin : Composant principal HeaderUpdated ===

  // === Début : Extraction des données du store Redux ===
  // Explication simple : On va chercher les informations sur l'utilisateur et ses points de jeu dans la grande mémoire de l'application.
  // Explication technique : Utilisation du hook useAppSelector pour extraire les données d'authentification et de gamification du store Redux, avec typage explicite et valeurs par défaut.
  const dispatch = useAppDispatch();
  
  // Utiliser les types explicites pour les états
  const auth = useAppSelector((state: RootState) => state.auth) as AuthState || {};
  const user = auth.user || { name: 'Utilisateur', email: 'utilisateur@exemple.com' };
  
  const gamification = useAppSelector((state: RootState) => state.gamification) as GamificationState || {};
  const actionPoints = gamification.actionPoints || 0;
  const badges = gamification.badges || [];
  
  // Ajouter l'état du timer
  const runningTimer = useAppSelector((state: RootState) => state.timer?.runningTimer);
  const [timerDuration, setTimerDuration] = useState(0);
  // === Fin : Extraction des données du store Redux ===

  // === Début : Effet pour mettre à jour la durée du timer ===
  // Explication simple : Cette partie fait que le compteur de temps se met à jour chaque seconde quand un timer est en cours.
  // Explication technique : Hook useEffect qui crée un intervalle pour incrémenter la durée affichée lorsqu'un timer est actif.
  useEffect(() => {
    if (!runningTimer || !runningTimer.isRunning) {
      setTimerDuration(0);
      return;
    }

    // Calculer la durée initiale si le timer était déjà en cours
    if (runningTimer.startTime) {
      const start = new Date(runningTimer.startTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      setTimerDuration(elapsed);
    }

    const interval = setInterval(() => {
      setTimerDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [runningTimer]);
  // === Fin : Effet pour mettre à jour la durée du timer ===

  // === Début : Fonction de formatage du temps ===
  // Explication simple : Cette fonction transforme les secondes en format lisible (HH:MM:SS).
  // Explication technique : Utilitaire qui convertit une durée en secondes en chaîne formatée.
  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  // === Fin : Fonction de formatage du temps ===

  // === Début : Rendu du composant Header ===
  // Explication simple : Ici, on dessine vraiment notre barre d'en-tête avec tous ses boutons et informations, comme quand tu assembles les pièces d'un puzzle.
  // Explication technique : Retour du JSX qui compose l'interface utilisateur du header, structuré en plusieurs sections distinctes avec des classes Tailwind pour le styling responsif et le support du thème sombre.
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md h-16 flex items-center justify-between px-4 md:px-6">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white">
        Task Manager
      </h1>
      <div className="flex items-center space-x-4">
        {/* === Début : Indicateur de timer actif === */}
        {/* Explication simple : Cette partie montre s'il y a un chronomètre en cours avec le temps qui défile. */}
        {/* Explication technique : Affichage conditionnel d'un indicateur de timer avec animation et interaction pour ouvrir le popup complet. */}
        {runningTimer && (
          <div 
            onClick={() => dispatch(toggleTimerPopup(true))}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full cursor-pointer hover:from-green-200 hover:to-emerald-200 dark:hover:from-green-800/30 dark:hover:to-emerald-800/30 transition-all duration-200 group"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-sm font-mono font-semibold text-green-800 dark:text-green-300">
              {formatTime(timerDuration)}
            </span>
            <svg 
              className="w-4 h-4 text-green-700 dark:text-green-400 transition-transform group-hover:rotate-12" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        )}
        {/* === Fin : Indicateur de timer actif === */}

        {/* === Début : Affichage des points d'action === */}
        {/* Explication simple : Cette partie montre combien de points l'utilisateur a gagné en accomplissant des tâches, comme un score dans un jeu. */}
        {/* Explication technique : Conteneur responsive qui affiche le compteur d'action points de gamification avec une icône, visible uniquement sur les écrans de taille moyenne et supérieure. */}
        <div className="hidden md:flex items-center bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full">
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          <span className="font-bold">{actionPoints}</span>
        </div>
        {/* === Fin : Affichage des points d'action === */}

        {/* === Début : Affichage des badges === */}
        {/* Explication simple : Cette section montre combien de badges ou médailles l'utilisateur a gagnés en utilisant l'application. */}
        {/* Explication technique : Conteneur qui affiche le compteur de badges avec une icône SVG, utilisant des classes conditionnelles pour l'adaptation au thème sombre. */}
        <div className="hidden md:flex items-center bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 px-3 py-1 rounded-full">
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-bold">{badges.length}</span>
        </div>
        {/* === Fin : Affichage des badges === */}
        
        {/* === Début : Intégration du composant DarkModeToggle === */}
        {/* Explication simple : On place ici notre interrupteur pour changer entre le mode jour et nuit, mais cette fois il est fabriqué séparément pour être plus facile à réutiliser. */}
        {/* Explication technique : Utilisation du composant modulaire DarkModeToggle qui encapsule toute la logique de basculement du thème, favorisant la réutilisabilité et la séparation des préoccupations. */}
        <DarkModeToggle />
        {/* === Fin : Intégration du composant DarkModeToggle === */}
        
        {/* === Début : Informations utilisateur === */}
        {/* Explication simple : Cette partie montre qui est connecté à l'application, avec sa photo et son nom. */}
        {/* Explication technique : Affichage des informations de l'utilisateur connecté avec son avatar et son nom, incluant des valeurs de fallback en cas d'absence de données. */}
        <div className="flex items-center space-x-2">
          <img
            src={user?.profile?.avatar || '/default-avatar.png'}
            alt={user?.name || 'Utilisateur'}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-gray-800 dark:text-white">{user?.name || 'Utilisateur'}</span>
        </div>
        {/* === Fin : Informations utilisateur === */}
        
        {/* === Début : Bouton de déconnexion === */}
        {/* Explication simple : Ce bouton permet de quitter l'application, comme quand tu appuies sur "sortir" dans un jeu. */}
        {/* Explication technique : Bouton qui déclenche la fonction de déconnexion passée via les props, avec styling Tailwind pour une apparence distinctive et des effets de survol. */}
        <button
          onClick={onLogout}
          className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Déconnexion
        </button>
        {/* === Fin : Bouton de déconnexion === */}
      </div>
    </header>
  );
  // === Fin : Rendu du composant Header ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre barre d'en-tête disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules de l'application.
export default HeaderUpdated;
// === Fin : Export du composant ===