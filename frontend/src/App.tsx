// frontend/src/App.tsx
// Application principale avec persistance de l'authentification

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import TimerPopup from './components/timer/TimerPopup';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import TaskForm from './pages/TaskForm';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import ClientDetail from './pages/ClientDetail';
import ClientProfitability from './pages/ClientProfitability';
import ClientDashboard from './pages/ClientDashboard';
import Gamification from './pages/Gamification';
import Profile from './pages/Profile';
import TestApi from './pages/TestApi';
import TestLogin from './TestLogin';
import AdminSetup from './AdminSetup';
import ClientStatistics from './pages/ClientStatistics';
import ConfettiEffect from './components/gamification/ConfettiEffect';
import { initializeAuth } from './services/api';
import { loginSuccess } from './store/slices/authSlice';

const App: React.FC = () => {
  const dispatch = useDispatch();
  const [showConfetti, setShowConfetti] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // === Vérification de l'authentification au démarrage ===
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔐 Vérification de l\'authentification...');
      
      try {
        // Vérifier le token stocké
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          // Vérifier la validité du token avec l'API
          const isValid = await initializeAuth();
          
          if (isValid) {
            // Token valide - restaurer l'état Redux
            const user = JSON.parse(userStr);
            dispatch(loginSuccess({ user, token }));
            setIsAuthenticated(true);
            console.log('✅ Utilisateur authentifié:', user.name);
          } else {
            // Token invalide - nettoyer
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
            console.log('❌ Token invalide, utilisateur déconnecté');
          }
        } else {
          console.log('📍 Pas de session trouvée');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
        setIsAuthenticated(false);
      } finally {
        setIsInitializing(false);
      }
    };

    checkAuth();
  }, [dispatch]);

  // === Écouteur d'événements pour les confettis ===
  useEffect(() => {
    const handleTriggerConfetti = () => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    };
    
    window.addEventListener('trigger-confetti', handleTriggerConfetti);
    return () => window.removeEventListener('trigger-confetti', handleTriggerConfetti);
  }, []);

  // === Affichage du loader pendant l'initialisation ===
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TimerPopup />
      <Routes>
        {/* Routes publiques */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Register />
          } 
        />
        <Route path="/test-api" element={<TestApi />} />
        <Route path="/test-login" element={<TestLogin />} />
        <Route path="/admin-setup" element={<AdminSetup />} />

        {/* Routes protégées */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/new" element={<ClientForm />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/clients/:id/profitability" element={<ClientProfitability />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/new" element={<TaskForm />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/dashboard/clients" element={<ClientDashboard />} />
            <Route path="/gamification" element={<Gamification />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/client-statistics" element={<ClientStatistics />} />
          </Route>
        </Route>

        {/* Route 404 */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Page non trouvée</p>
                <a 
                  href="/" 
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retour à l'accueil
                </a>
              </div>
            </div>
          } 
        />
      </Routes>
      
      {/* Effet de confetti */}
      <ConfettiEffect 
        show={showConfetti} 
        duration={3000}
        particleCount={100}
        onComplete={() => setShowConfetti(false)}
      />
    </>
  );
};

export default App;