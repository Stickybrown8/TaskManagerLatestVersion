import React from 'react';
import { useAppSelector } from '../hooks';
import { RootState, AuthState, GamificationState } from '../store';
import DarkModeToggle from './DarkModeToggle';

interface HeaderProps {
  onLogout: () => void;
}

const HeaderUpdated: React.FC<HeaderProps> = ({ onLogout }) => {
  // Utiliser les types explicites pour les états
  const auth = useAppSelector((state: RootState) => state.auth) as AuthState || {};
  const user = auth.user || { name: 'Utilisateur', email: 'utilisateur@exemple.com' };
  
  const gamification = useAppSelector((state: RootState) => state.gamification) as GamificationState || {};
  const actionPoints = gamification.actionPoints || 0;
  const badges = gamification.badges || [];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md h-16 flex items-center justify-between px-4 md:px-6">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white">
        Task Manager
      </h1>
      <div className="flex items-center space-x-4">
        {/* Points d'action */}
        <div className="hidden md:flex items-center bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full">
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          <span className="font-bold">{actionPoints}</span>
        </div>
        {/* Badges */}
        <div className="hidden md:flex items-center bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 px-3 py-1 rounded-full">
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-bold">{badges.length}</span>
        </div>
        {/* Bouton dark mode */}
        <DarkModeToggle />
        {/* Utilisateur */}
        <div className="flex items-center space-x-2">
          <img
            src={user?.profile?.avatar || '/default-avatar.png'}
            alt={user?.name || 'Utilisateur'}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-gray-800 dark:text-white">{user?.name || 'Utilisateur'}</span>
        </div>
        {/* Bouton de déconnexion */}
        <button
          onClick={onLogout}
          className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
};

export default HeaderUpdated;
