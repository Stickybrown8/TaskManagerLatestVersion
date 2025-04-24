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
    
    // Ajouter un log pour déboguer
    console.log("DarkMode toggled:", !darkMode);
    
    // Forcer l'application de la classe pour le mode sombre sur le document
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={handleToggleDarkMode}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
      title={darkMode ? "Passer au mode clair" : "Passer au mode sombre"}
    >
      {darkMode ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
};

export default DarkModeToggle;
