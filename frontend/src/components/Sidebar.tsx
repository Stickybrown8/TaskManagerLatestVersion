import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks';
import { toggleSidebar } from '../store/slices/uiSlice';
import { ChartBarIcon } from '@heroicons/react/24/outline';  // ou '@heroicons/react/24/outline' selon votre version

// Icônes
const DashboardIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ClientsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const TasksIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const GamificationIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
const ProfileIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CollapseIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>;
const ExpandIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>;

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  
  // Utilisation de l'opérateur nullish coalescing (??) pour fournir des valeurs par défaut
  const ui = useAppSelector(state => state.ui) || {};
  const { sidebarOpen = true } = ui;
  
  const auth = useAppSelector(state => state.auth) || {};
  const { user = { name: 'Utilisateur', profile: { avatar: '/default-avatar.png' } } } = auth;
  
  const gamification = useAppSelector(state => state.gamification) || {};
  const { level = 1, experience = 0 } = gamification;

  // Navigation items
  const navItems = [
    { path: '/', name: 'Tableau de bord', icon: <DashboardIcon /> },
    { path: '/clients', name: 'Clients', icon: <ClientsIcon /> },
    { path: '/tasks', name: 'Tâches', icon: <TasksIcon /> },
    { path: '/gamification', name: 'Gamification', icon: <GamificationIcon /> },
    { path: '/profile', name: 'Profil', icon: <ProfileIcon /> },
    { path: '/client-statistics', name: 'Statistiques Clients', icon: <ChartBarIcon className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-10 flex flex-col bg-primary-700 dark:bg-gray-800 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'
        }`}
    >
      {/* Logo */}
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

      {/* User Info */}
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

      {/* Navigation */}
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

      {/* Version */}
      <div className="p-4 text-xs text-center text-primary-300 dark:text-gray-400">
        {sidebarOpen ? 'Version 1.0.0' : 'v1.0'}
      </div>
    </aside>
  );
};

export default Sidebar;
