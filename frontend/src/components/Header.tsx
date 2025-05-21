/*
 * EN-TÊTE DE L'APPLICATION - frontend/src/components/Header.tsx
 *
 * Explication simple:
 * Ce fichier crée la barre supérieure de l'application que tu vois sur toutes les pages.
 * Cette barre contient le titre "Task Manager", un compteur de points et de badges pour 
 * motiver l'utilisateur, un bouton pour passer en mode nuit/jour, l'avatar de l'utilisateur
 * et un bouton pour se déconnecter. C'est comme le tableau de bord d'une voiture qui
 * affiche toutes les informations importantes et les commandes principales.
 *
 * Explication technique:
 * Composant React fonctionnel qui constitue l'en-tête global de l'application, affichant
 * le branding, les éléments de gamification, le toggle du thème et les contrôles utilisateur.
 * Il consomme plusieurs tranches du store Redux pour accéder aux états d'UI, d'authentification
 * et de gamification.
 *
 * Où ce fichier est utilisé:
 * Intégré dans le layout principal de l'application, affiché en haut de chaque page une fois
 * que l'utilisateur est authentifié.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks personnalisés depuis '../hooks'
 * - Consomme les actions du slice UI via '../store/slices/uiSlice' 
 * - Accède aux états globaux depuis le store Redux (auth, ui, gamification)
 * - Reçoit une fonction onLogout du composant parent pour gérer la déconnexion
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour construire notre barre d'en-tête, comme quand tu prends tes Lego avant de commencer à construire.
// Explication technique : Importation de React, des hooks Redux personnalisés, des actions du slice UI et des types TypeScript nécessaires pour le typage des états.
import React from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { toggleDarkMode } from '../store/slices/uiSlice';
import { RootState, AuthState, GamificationState, UIState } from '../store';
// === Fin : Importation des dépendances ===

// === Début : Définition de l'interface des props ===
// Explication simple : On explique à l'ordinateur ce que notre barre d'en-tête a besoin pour fonctionner correctement, comme une liste d'ingrédients pour une recette.
// Explication technique : Déclaration d'une interface TypeScript qui définit les propriétés attendues par le composant, notamment la fonction callback pour la déconnexion.
interface HeaderProps {
  onLogout: () => void;
}
// === Fin : Définition de l'interface des props ===

// === Début : Composant principal Header ===
// Explication simple : On commence à construire notre barre d'en-tête avec tous ses éléments.
// Explication technique : Définition du composant fonctionnel React avec typage explicite des props via l'interface HeaderProps.
const Header: React.FC<HeaderProps> = ({ onLogout }) => {
// === Fin : Composant principal Header ===

  // === Début : Initialisation des hooks Redux ===
  // Explication simple : On prépare ce dont on a besoin pour parler au "cerveau" de l'application et obtenir les informations importantes.
  // Explication technique : Configuration du dispatcher Redux et extraction des données des différentes branches du store global avec gestion défensive via les opérateurs de coalescence nullish.
  const dispatch = useAppDispatch();
  
  // Utiliser les types explicites pour les états
  const ui = useAppSelector((state: RootState) => state.ui) as UIState || {};
  const { darkMode = false } = ui;
  
  const auth = useAppSelector((state: RootState) => state.auth) as AuthState || {};
  const user = auth.user || { name: 'Utilisateur', email: 'utilisateur@exemple.com' };
  
  const gamification = useAppSelector((state: RootState) => state.gamification) as GamificationState || {};
  const actionPoints = gamification.actionPoints || 0;
  const badges = gamification.badges || [];
  // === Fin : Initialisation des hooks Redux ===

  // === Début : Rendu du composant Header ===
  // Explication simple : Ici, on dessine vraiment notre barre d'en-tête avec tous ses boutons et informations, comme quand tu assembles finalement tes Lego pour créer le château.
  // Explication technique : Retour du JSX qui compose l'interface utilisateur du header, structuré en plusieurs sections distinctes avec des classes Tailwind pour le styling responsif et le support du thème sombre.
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md h-16 flex items-center justify-between px-4 md:px-6">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white">
        Task Manager
      </h1>
      <div className="flex items-center space-x-4">
        {/* === Début : Affichage des points d'action === */}
        {/* Explication simple : Cette partie montre combien de points l'utilisateur a gagné en accomplissant des tâches, comme des points dans un jeu vidéo. */}
        {/* Explication technique : Conteneur conditionnel qui affiche le compteur de points d'action de gamification avec une icône, visible uniquement sur les écrans de taille moyenne et supérieure. */}
        <div className="hidden md:flex items-center bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full">
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          <span className="font-bold">{actionPoints}</span>
        </div>
        {/* === Fin : Affichage des points d'action === */}

        {/* === Début : Affichage des badges === */}
        {/* Explication simple : Cette section montre combien de badges ou récompenses l'utilisateur a gagnés, comme les médailles qu'on collectionne. */}
        {/* Explication technique : Conteneur responsive qui affiche le compteur de badges de l'utilisateur, visible uniquement sur les écrans de taille moyenne et supérieure, avec styling conditionnel pour le thème sombre. */}
        <div className="hidden md:flex items-center bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 px-3 py-1 rounded-full">
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            {/* ...svg paths pour les badges... */}
          </svg>
          <span className="font-bold">{badges.length}</span>
        </div>
        {/* === Fin : Affichage des badges === */}

        {/* === Début : Bouton de basculement du mode sombre === */}
        {/* Explication simple : Ce bouton permet de changer entre le mode jour (clair) et le mode nuit (sombre), comme quand tu allumes ou éteins la lumière dans ta chambre. */}
        {/* Explication technique : Bouton interactif qui dispatch l'action toggleDarkMode au clic pour basculer le thème de l'application, avec icônes conditionnelles selon l'état actuel. */}
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          title="Changer le mode sombre"
        >
          {darkMode ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 0110.586 10.586z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 17a1 1 0 011 1 1 1 0 01-2 0 1 1 0 011-1zm4.22-2.03a1 1 0 10-1.42 1.42 1 1 0 001.42-1.42zM17 10a1 1 0 100 2 1 1 0 000-2zm-7-7a1 1 0 112 0 1 1 0 01-2 0zm-5.22 2.03a1 1 0 101.42-1.42 1 1 0 00-1.42 1.42zM3 10a1 1 0 100 2 1 1 0 000-2zm1.29 4.29a1 1 0 101.42 1.42 1 1 0 00-1.42-1.42z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        {/* === Fin : Bouton de basculement du mode sombre === */}

        {/* === Début : Informations utilisateur === */}
        {/* Explication simple : Cette partie montre qui est connecté à l'application, avec sa photo et son nom, comme une carte d'identité. */}
        {/* Explication technique : Conteneur d'informations utilisateur qui affiche l'avatar et le nom de l'utilisateur connecté, avec des valeurs de fallback en cas d'absence de données. */}
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
        {/* Explication simple : Ce bouton permet de quitter l'application et de revenir à l'écran de connexion, comme quand tu sors d'un jeu pour aller jouer à autre chose. */}
        {/* Explication technique : Bouton qui déclenche la fonction de déconnexion passée via les props, stylisé pour indiquer une action destructive avec des effets de survol. */}
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
// Explication simple : On rend notre barre d'en-tête disponible pour que d'autres parties de l'application puissent l'utiliser, comme quand tu partages ton jouet avec tes amis.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules de l'application.
export default Header;
// === Fin : Export du composant ===
