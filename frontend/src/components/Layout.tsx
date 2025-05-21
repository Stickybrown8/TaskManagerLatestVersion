/*
 * STRUCTURE PRINCIPALE DE L'APPLICATION - frontend/src/components/Layout.tsx
 *
 * Explication simple:
 * Ce fichier crée la structure de base que tu vois sur toutes les pages de l'application.
 * Il organise l'écran en trois parties principales : une barre latérale à gauche (menu),
 * une barre supérieure (avec le nom de l'utilisateur et le bouton de déconnexion), et
 * un grand espace central où s'affiche le contenu des différentes pages. C'est comme
 * la structure d'une maison avec ses murs et ses pièces, où le reste du mobilier (les
 * autres composants) peut être placé.
 *
 * Explication technique:
 * Composant React fonctionnel qui implémente le layout principal de l'application, structurant
 * l'interface en trois zones distinctes : sidebar, header et zone de contenu principal.
 * Il gère également l'état d'ouverture/fermeture de la sidebar et le thème clair/sombre.
 *
 * Où ce fichier est utilisé:
 * Intégré comme composant parent dans le routeur principal de l'application, englobant
 * toutes les routes/pages accessibles une fois l'utilisateur authentifié.
 *
 * Connexions avec d'autres fichiers:
 * - Importe et utilise les composants Sidebar et Header
 * - Utilise les hooks personnalisés useAppSelector et useAppDispatch depuis '../hooks'
 * - Importe l'action logout depuis '../store/slices/authSlice'
 * - Utilise react-router-dom pour la navigation et l'affichage des routes enfants
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour construire notre maison, comme quand tu rassembles tes Lego avant de commencer à construire.
// Explication technique : Importation des modules React, des hooks de React Router, des composants enfants, des hooks Redux personnalisés et de l'action de déconnexion.
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppSelector, useAppDispatch } from '../hooks';
import { logout } from '../store/slices/authSlice';
// === Fin : Importation des dépendances ===

// === Début : Définition de l'interface des props ===
// Explication simple : On explique à l'ordinateur que notre structure peut avoir des enfants, comme une maison qui peut contenir des meubles.
// Explication technique : Déclaration d'une interface TypeScript qui définit les propriétés optionnelles attendues par le composant, spécifiquement les éléments enfants à rendre.
interface LayoutProps {
  children?: React.ReactNode;
}
// === Fin : Définition de l'interface des props ===

// === Début : Composant principal Layout ===
// Explication simple : On commence à construire notre maison principale qui va contenir toutes les pièces de l'application.
// Explication technique : Définition du composant fonctionnel React avec typage explicite des props via l'interface LayoutProps, destructurant les enfants pour le rendu conditionnel.
const Layout: React.FC<LayoutProps> = ({ children }) => {
// === Fin : Composant principal Layout ===

  // === Début : Récupération des états du store Redux ===
  // Explication simple : On regarde dans la mémoire de l'application pour savoir si le menu est ouvert ou fermé, et si on est en mode jour ou nuit.
  // Explication technique : Utilisation du hook useAppSelector pour extraire l'état UI du store Redux, avec accès sécurisé aux propriétés et valeurs par défaut via l'opérateur de coalescence nullish.
  const ui = useAppSelector(state => state.ui) || {};
  const sidebarOpen = ui?.sidebarOpen ?? true;
  const darkMode = ui?.darkMode ?? false;
  // === Fin : Récupération des états du store Redux ===

  // === Début : Initialisation des hooks de navigation et d'action ===
  // Explication simple : On prépare deux outils importants : un pour envoyer des messages au "cerveau" de l'application, et un autre pour changer de page.
  // Explication technique : Configuration du dispatcher Redux pour émettre des actions et du hook de navigation de React Router pour les redirections programmatiques.
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  // === Fin : Initialisation des hooks de navigation et d'action ===

  // === Début : Fonction de déconnexion ===
  // Explication simple : Cette fonction permet à l'utilisateur de se déconnecter et de retourner à la page de connexion, comme quand tu sors de ta maison et fermes la porte à clé.
  // Explication technique : Gestionnaire d'événement qui dispatch l'action de déconnexion au store Redux puis redirige l'utilisateur vers la route de login via le hook useNavigate.
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  // === Fin : Fonction de déconnexion ===

  // === Début : Rendu de la structure principale ===
  // Explication simple : Ici, on assemble toutes les pièces pour construire notre maison : le menu sur le côté, la barre en haut, et l'espace principal au milieu.
  // Explication technique : Retour du JSX qui structure l'interface en trois zones distinctes - sidebar, header et zone de contenu - avec des classes CSS conditionnelles selon l'état de la sidebar et du mode sombre.
  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
      {/* === Début : Barre latérale === */}
      {/* Explication simple : C'est le menu qui se trouve sur le côté gauche de l'écran, avec des boutons pour naviguer vers différentes pages. */}
      {/* Explication technique : Inclusion du composant Sidebar qui encapsule la navigation principale de l'application avec ses liens et icônes. */}
      <Sidebar />
      {/* === Fin : Barre latérale === */}

      {/* === Début : Contenu principal === */}
      {/* Explication simple : C'est la grande partie de droite qui contient la barre du haut (avec ton nom) et l'espace où s'affichent toutes les pages. */}
      {/* Explication technique : Conteneur flex qui occupe l'espace restant et s'adapte dynamiquement à l'état de la sidebar, avec transition animée pour une expérience utilisateur fluide. */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* === Début : En-tête === */}
        {/* Explication simple : C'est la barre tout en haut qui affiche ton nom et le bouton pour te déconnecter. */}
        {/* Explication technique : Composant Header qui reçoit la fonction de déconnexion en props pour permettre à l'utilisateur de terminer sa session. */}
        <Header onLogout={handleLogout} />
        {/* === Fin : En-tête === */}

        {/* === Début : Zone de contenu principal === */}
        {/* Explication simple : C'est le grand espace au milieu où s'affichent toutes les pages différentes quand tu navigues dans l'application. */}
        {/* Explication technique : Élément main qui contient soit les enfants passés explicitement, soit le composant Outlet de React Router qui rend les routes enfants, avec styling adaptatif pour le responsive et le thème sombre. */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
          {children || <Outlet />}
        </main>
        {/* === Fin : Zone de contenu principal === */}
      </div>
      {/* === Fin : Contenu principal === */}
    </div>
  );
  // === Fin : Rendu de la structure principale ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre structure principale disponible pour que le reste de l'application puisse l'utiliser, comme quand tu partages ton plan de construction avec d'autres personnes.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules de l'application, notamment dans le routeur principal.
export default Layout;
// === Fin : Export du composant ===
