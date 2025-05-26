/*
 * BOUTON DE BASCULEMENT DU MODE SOMBRE - frontend/src/components/DarkModeToggle.tsx
 * Version corrigée avec les bons chemins d'import
 */

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { toggleDarkMode } from '../store/slices/uiSlice';

const DarkModeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector(state => state.ui?.darkMode) || false;

  // Appliquer le mode sombre/clair au document HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
    
    console.log("DarkMode toggled:", !darkMode);
    
    // Forcer l'application de la classe pour le mode sombre
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={handleToggleDarkMode}
      className="relative p-3 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 group"
      title={darkMode ? "Passer au mode clair" : "Passer au mode sombre"}
    >
      <div className="relative w-6 h-6">
        {/* Icône soleil */}
        <svg 
          className={`absolute inset-0 w-6 h-6 transition-all duration-500 transform ${
            darkMode ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
          />
        </svg>
        
        {/* Icône lune */}
        <svg 
          className={`absolute inset-0 w-6 h-6 transition-all duration-500 transform ${
            darkMode ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
          />
        </svg>
      </div>
      
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};

export default DarkModeToggle;