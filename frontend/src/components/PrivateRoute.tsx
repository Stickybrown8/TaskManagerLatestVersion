import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks';

interface PrivateRouteProps {
  children?: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const authState = useAppSelector(state => state.auth) || {};
  const { isAuthenticated = false, loading = false } = authState;

  // Loader si l'authentification est en cours
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Si pas authentifié, redirige vers /login (en gardant la page d'origine)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Sinon, affiche la page privée
  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute;
