import React, { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks';

interface PrivateRouteProps {
  children?: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated = false, loading = false, token, rehydrated = false } = useAppSelector(state => state.auth) || {};

  // Debug temporaire
  // console.log({ isAuthenticated, token, rehydrated, loading });
  console.log({ isAuthenticated, token, rehydrated, loading });
  console.log("PrivateRoute.tsx rendu !");



  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute;
