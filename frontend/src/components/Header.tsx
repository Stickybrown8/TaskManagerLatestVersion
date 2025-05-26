/*
 * EN-TÊTE DE L'APPLICATION (VERSION FINALE) - frontend/src/components/Header.tsx
 * Version avec types TypeScript corrigés
 */

import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { RootState, AuthState, GamificationState } from '../store/index';
import { toggleTimerPopup } from '../store/slices/timerSlice';
import DarkModeToggle from './DarkModeToggle';
import { getAvatarUrl, getColorFromText } from '../utils/imageUtils';

interface HeaderProps {
  onLogout: () => void;
}

// Composant Avatar Utilisateur avec fallback intelligent
interface UserAvatarProps {
  user: {
    name?: string;  // ✅ CORRECTION: rendre name optionnel
    profile?: {
      avatar?: string;
    };
  };
  size?: 'small' | 'medium';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'small' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-base'
  };

  // ✅ CORRECTION: Gérer le cas où name peut être undefined
  const userName = user?.name || 'U';
  const avatarUrl = user?.profile?.avatar ? getAvatarUrl(user.profile.avatar) : '';

  // Si pas d'avatar ou erreur de chargement, afficher l'initiale
  if (!avatarUrl || imageError) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${getColorFromText(userName)} flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white/20`}>
        {userName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={userName}
      className={`${sizeClasses[size]} rounded-full object-cover shadow-lg ring-2 ring-white/20`}
      onError={() => {
        console.log('❌ Erreur chargement avatar dans header:', avatarUrl);
        setImageError(true);
      }}
    />
  );
};

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const dispatch = useAppDispatch();
  
  // États Redux avec gestion défensive
  const auth = useAppSelector((state: RootState) => state.auth) as AuthState || {};
  const user = auth.user || { name: 'Utilisateur', email: 'utilisateur@exemple.com' };
  
  const gamification = useAppSelector((state: RootState) => state.gamification) as GamificationState || {};
  const actionPoints = gamification.actionPoints || 0;
  const badges = gamification.badges || [];
  
  // État du timer
  const runningTimer = useAppSelector((state: RootState) => state.timer?.runningTimer);
  const [timerDuration, setTimerDuration] = useState(0);

  // Mise à jour du timer
  useEffect(() => {
    if (!runningTimer || !runningTimer.isRunning) {
      setTimerDuration(0);
      return;
    }

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

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
      {/* Logo et titre avec animation */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Task Manager
        </h1>
      </div>

      {/* Section centrale avec indicateurs */}
      <div className="flex items-center space-x-4">
        {/* Indicateur de timer actif avec animation */}
        {runningTimer && (
          <div 
            onClick={() => dispatch(toggleTimerPopup(true))}
            className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-full cursor-pointer hover:from-emerald-200 hover:to-green-200 dark:hover:from-emerald-800/40 dark:hover:to-green-800/40 transition-all duration-300 group shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg" />
              <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-sm font-mono font-bold text-emerald-800 dark:text-emerald-300">
              {formatTime(timerDuration)}
            </span>
            <svg 
              className="w-4 h-4 text-emerald-700 dark:text-emerald-400 transition-transform group-hover:rotate-12" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}

        {/* Points d'action avec design moderne */}
        <div className="hidden md:flex items-center bg-gradient-to-r from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 text-primary-800 dark:text-primary-200 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-center w-6 h-6 bg-primary-500 rounded-full mr-2">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-bold text-lg">{actionPoints}</span>
          <span className="text-xs font-medium ml-1 opacity-75">pts</span>
        </div>

        {/* Badges avec design moderne */}
        <div className="hidden md:flex items-center bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-center w-6 h-6 bg-amber-500 rounded-full mr-2">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-bold text-lg">{badges.length}</span>
          <span className="text-xs font-medium ml-1 opacity-75">badges</span>
        </div>
        
        {/* Toggle mode sombre */}
        <DarkModeToggle />
        
        {/* Informations utilisateur avec design amélioré */}
        <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
          <UserAvatar user={user} size="small" />
          <span className="text-gray-800 dark:text-white font-medium hidden sm:block">
            {user?.name || 'Utilisateur'}
          </span>
        </div>
        
        {/* Bouton de déconnexion avec design moderne */}
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
};

export default Header;