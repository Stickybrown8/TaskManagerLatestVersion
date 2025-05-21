/*
 * BARRE DE NAVIGATION LATÉRALE - frontend/src/components/Sidebar.tsx
 *
 * Explication simple:
 * Ce fichier crée le menu latéral que tu vois sur le côté gauche de l'application. 
 * C'est comme le menu d'un restaurant qui te montre toutes les pages disponibles.
 * Il affiche ton avatar, ton niveau de jeu, et des boutons pour aller sur différentes
 * pages comme le tableau de bord, les clients, les tâches, etc. Tu peux aussi le
 * réduire pour qu'il prenne moins de place sur ton écran.
 *
 * Explication technique:
 * Composant React fonctionnel qui implémente la sidebar de navigation principale de
 * l'application, avec un affichage responsive qui peut être réduit ou étendu.
 * Il affiche les informations utilisateur, les éléments de gamification (niveau,
 * expérience) et les liens de navigation vers les différentes routes de l'application.
 *
 * Où ce fichier est utilisé:
 * Intégré dans le composant Layout principal qui structure l'ensemble de l'interface
 * utilisateur, visible sur toutes les pages une fois l'utilisateur authentifié.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks personnalisés depuis '../hooks' pour accéder au store Redux
 * - Consomme l'action toggleSidebar du slice '../store/slices/uiSlice'
 * - Utilise le composant Link de react-router-dom pour la navigation
 * - Accède aux états globaux UI, Auth et Gamification depuis le store Redux
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour construire notre menu, comme quand tu rassembles tes ingrédients avant de cuisiner.
// Explication technique : Importation de React, des composants et hooks de React Router, des hooks Redux personnalisés, de l'action pour contrôler la sidebar et des icônes Hero.
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks';
import { toggleSidebar } from '../store/slices/uiSlice';
import { ChartBarIcon } from '@heroicons/react/24/outline';  // ou '@heroicons/react/24/outline' selon votre version
// === Fin : Importation des dépendances ===

// === Début : Définition des composants d'icônes ===
// Explication simple : On dessine de petites images qui seront affichées à côté de chaque bouton du menu, comme des petits dessins pour reconnaître chaque section.
// Explication technique : Définition de composants fonctionnels qui encapsulent les SVG pour les différentes icônes utilisées dans la navigation, avec stylisation cohérente.
// Icônes
const DashboardIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ClientsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const TasksIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const GamificationIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
const ProfileIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CollapseIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>;
const ExpandIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>;
// === Fin : Définition des composants d'icônes ===

// === Début : Composant principal Sidebar ===
// Explication simple : C'est le menu principal qu'on va construire, avec tous ses boutons et décorations.
// Explication technique : Définition du composant fonctionnel Sidebar qui gère l'affichage du menu de navigation latéral et son état réduit/étendu.
const Sidebar = () => {
// === Fin : Composant principal Sidebar ===

  // === Début : Initialisation des hooks et accès au store Redux ===
  // Explication simple : On prépare des outils pour parler avec le "cerveau" de l'application et savoir où on se trouve.
  // Explication technique : Configuration du dispatcher Redux pour les actions, récupération de la location actuelle pour le highlighting de navigation, et extraction des données des différents slices du store.
  const dispatch = useAppDispatch();
  const location = useLocation();
  
  // Utilisation de l'opérateur nullish coalescing (??) pour fournir des valeurs par défaut
  const ui = useAppSelector(state => state.ui) || {};
  const { sidebarOpen = true } = ui;
  
  const auth = useAppSelector(state => state.auth) || {};
  const { user = { name: 'Utilisateur', profile: { avatar: '/default-avatar.png' } } } = auth;
  
  const gamification = useAppSelector(state => state.gamification) || {};
  const { level = 1, experience = 0 } = gamification;
  // === Fin : Initialisation des hooks et accès au store Redux ===

  // === Début : Configuration des éléments de navigation ===
  // Explication simple : On crée la liste de tous les boutons qui seront dans notre menu, comme quand tu fais la liste des endroits que tu veux visiter.
  // Explication technique : Définition d'un tableau d'objets qui contient les informations de chaque lien de navigation, incluant le chemin, le nom affiché et l'icône associée.
  // Navigation items
  const navItems = [
    { path: '/', name: 'Tableau de bord', icon: <DashboardIcon /> },
    { path: '/clients', name: 'Clients', icon: <ClientsIcon /> },
    { path: '/tasks', name: 'Tâches', icon: <TasksIcon /> },
    { path: '/gamification', name: 'Gamification', icon: <GamificationIcon /> },
    { path: '/profile', name: 'Profil', icon: <ProfileIcon /> },
    { path: '/client-statistics', name: 'Statistiques Clients', icon: <ChartBarIcon className="w-5 h-5" /> },
  ];
  // === Fin : Configuration des éléments de navigation ===

  // === Début : Rendu du composant Sidebar ===
  // Explication simple : Maintenant on dessine vraiment notre menu avec toutes ses parties, comme quand tu assembles les pièces d'un puzzle.
  // Explication technique : Retour du JSX qui structure l'interface utilisateur du sidebar, organisé en sections distinctes (entête, profil utilisateur, navigation, version) avec classes conditionnelles selon l'état ouvert/fermé.
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-10 flex flex-col bg-primary-700 dark:bg-gray-800 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'
        }`}
    >
      {/* === Début : Section logo et bouton toggle === */}
      {/* Explication simple : Cette partie montre le nom de l'application en haut du menu et le bouton pour réduire ou agrandir le menu. */}
      {/* Explication technique : Entête du sidebar avec le logo/titre de l'application et un bouton pour basculer l'état d'expansion, avec rendu conditionnel selon l'état sidebarOpen. */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-primary-800 dark:border-gray-700">
        {sidebarOpen ? (
          <h1 className="text-xl font-bold">Task Manager</h1>
        ) : (
          <h1 className="text-xl font-bold">TM</h1>
        )}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-1 rounded-md hover:bg-primary-600 dark:hover:bg-gray-700"
        >
          {sidebarOpen ? <CollapseIcon /> : <ExpandIcon />}
        </button>
      </div>
      {/* === Fin : Section logo et bouton toggle === */}

      {/* === Début : Section profil utilisateur === */}
      {/* Explication simple : Cette partie montre ta photo de profil, ton nom et ta barre de progression de niveau, comme dans un jeu vidéo. */}
      {/* Explication technique : Affichage des informations de l'utilisateur connecté avec son avatar, son nom, son niveau de gamification et une barre de progression visuelle pour l'expérience, s'adaptant à l'état réduit/étendu de la sidebar. */}
      <div className={`flex items-center p-4 border-b border-primary-800 dark:border-gray-700 ${sidebarOpen ? 'flex-row' : 'flex-col'}`}>
        <div className="relative">
          <img
            src={user?.profile?.avatar || '/default-avatar.png'}
            alt="Avatar"
            className="w-10 h-10 rounded-full"
          />
          <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 bg-secondary-500 rounded-full text-xs font-bold">
            {level}
          </div>
        </div>
        {sidebarOpen && (
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name || 'Utilisateur'}</p>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
              <div
                className="h-full bg-secondary-500 rounded-full"
                style={{ width: `${experience}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      {/* === Fin : Section profil utilisateur === */}

      {/* === Début : Section de navigation principale === */}
      {/* Explication simple : C'est la liste de tous les boutons pour aller sur les différentes pages, comme un plan de métro qui te montre où tu peux aller. */}
      {/* Explication technique : Menu de navigation principal avec liste de liens vers les différentes routes de l'application, mettant en évidence la route active et s'adaptant à l'état de la sidebar. */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center p-2 rounded-lg transition-colors ${location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path))
                  ? 'bg-primary-800 dark:bg-gray-700'
                  : 'hover:bg-primary-600 dark:hover:bg-gray-700'
                  } ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="ml-3">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* === Fin : Section de navigation principale === */}

      {/* === Début : Section version === */}
      {/* Explication simple : Tout en bas du menu, on affiche le numéro de version de l'application, comme l'étiquette sur un produit qui indique sa version. */}
      {/* Explication technique : Pied de page du sidebar affichant la version de l'application, avec affichage conditionnel selon l'état d'expansion du menu. */}
      <div className="p-4 text-xs text-center text-primary-300 dark:text-gray-400">
        {sidebarOpen ? 'Version 1.0.0' : 'v1.0'}
      </div>
      {/* === Fin : Section version === */}
    </aside>
  );
  // === Fin : Rendu du composant Sidebar ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre menu disponible pour que d'autres parties de l'application puissent l'utiliser, comme quand tu partages ton jouet avec tes amis.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules, notamment dans le composant Layout principal.
export default Sidebar;
// === Fin : Export du composant ===
