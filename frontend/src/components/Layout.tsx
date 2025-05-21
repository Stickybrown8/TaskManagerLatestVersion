import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import HeaderUpdated from './HeaderUpdated';
import { useAppSelector, useAppDispatch } from '../hooks';
import { logout } from '../store/slices/authSlice';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const ui = useAppSelector(state => state.ui) || {};
  const sidebarOpen = ui?.sidebarOpen ?? true;
  const darkMode = ui?.darkMode ?? false;

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Handler de déconnexion
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header (on passe handleLogout en prop) */}
        <HeaderUpdated onLogout={handleLogout} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default Layout;
