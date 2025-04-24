import React from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { toggleDarkMode } from '../store/slices/uiSlice';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const dispatch = useAppDispatch();

  const ui = useAppSelector(state => state.ui) || {};
  const { darkMode = false } = ui;

  const auth = useAppSelector(state => state.auth) || {};
  const { user = null } = auth;

  const gamification = useAppSelector(state => state.gamification) || {};
  const { actionPoints = 0, badges = [] } = gamification;

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
            {/* ...svg paths pour les badges... */}
          </svg>
          <span className="font-bold">{badges.length}</span>
        </div>
        {/* Bouton dark mode */}
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          title="Changer le mode sombre"
        >
          {darkMode ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 0010.586 10.586z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 17a1 1 0 011 1 1 1 0 01-2 0 1 1 0 011-1zm4.22-2.03a1 1 0 10-1.42 1.42 1 1 0 001.42-1.42zM17 10a1 1 0 100 2 1 1 0 000-2zm-7-7a1 1 0 112 0 1 1 0 01-2 0zm-5.22 2.03a1 1 0 101.42-1.42 1 1 0 00-1.42 1.42zM3 10a1 1 0 100 2 1 1 0 000-2zm1.29 4.29a1 1 0 101.42 1.42 1 1 0 00-1.42-1.42z" clipRule="evenodd" />
            </svg>
          )}
        </button>
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

export default Header;
