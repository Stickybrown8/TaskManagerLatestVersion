import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import TimerPopupFix from './components/timer/TimerPopupFix';
import TimerDebug from './debug/TimerDebug';
import TestTimer from './debug/TestTimer';
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

const App: React.FC = () => {
  console.log("App.tsx rendu !");
  
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const handleTriggerConfetti = () => {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    };
    
    window.addEventListener('trigger-confetti', handleTriggerConfetti);
    return () => window.removeEventListener('trigger-confetti', handleTriggerConfetti);
  }, []);

  return (
    <>
      <TimerPopupFix />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/test-api" element={<TestApi />} />
        <Route path="/test-login" element={<TestLogin />} />
        <Route path="/admin-setup" element={<AdminSetup />} />
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
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
            <Route path="*" element={<div>Page non trouvée</div>} />
          </Route>
        </Route>
      </Routes>
      {process.env.NODE_ENV !== 'production' && <TimerDebug />}
      {process.env.NODE_ENV !== 'production' && <TestTimer />}
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
