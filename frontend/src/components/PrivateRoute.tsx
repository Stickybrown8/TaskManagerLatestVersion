import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../hooks';

interface PrivateRouteProps {
  children?: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAppSelector(state => state.auth);

  // Si l'authentification est en cours de vérification, afficher un loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si l'utilisateur est authentifié, rendre les enfants ou utiliser Outlet
  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute;