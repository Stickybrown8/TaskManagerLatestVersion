import React from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { toggleDarkMode } from '../store/slices/uiSlice';
import { logout } from '../store/slices/authSlice';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSelector(state => state.ui);
  const { user } = useAppSelector(state => state.auth);
  const { actionPoints, badges } = useAppSelector(state => state.gamification);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md h-16 flex items-center justify-between px-4 md:px-6">
      {/* Titre de la page */}
      <h1 className="text-xl font-bold text-gray-800 dark:text-white">
        Task Manager
      </h1>

      {/* Actions et informations utilisateur */}
      <div className="flex items-center space-x-4">
        {/* Points d'action */}
        <div className="hidden md:flex items-center bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full">
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          <span className="font-bold">{actionPoints}</span>
        </div>

        {/* Badges */}
        <div className="hidden md:flex items-center bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-200 px-3 py-1 rounded-full">
          <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-bold">{badges?.length || 0}</span>
        </div>

        {/* Bouton mode sombre/clair */}
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>

        {/* Menu utilisateur */}
        <div className="relative">
          <button className="flex items-center space-x-2 focus:outline-none">
            <img
              src={user?.profile.avatar || '/default-avatar.png'}
              alt="Avatar"
              className="w-8 h-8 rounded-full"
            />
            <span className="hidden md:inline text-gray-800 dark:text-white">{user?.name}</span>
          </button>
          {/* Menu déroulant (à implémenter) */}
        </div>

        {/* Bouton de déconnexion */}
        <button
          onClick={handleLogout}
          className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 focus:outline-none"
          aria-label="Logout"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;