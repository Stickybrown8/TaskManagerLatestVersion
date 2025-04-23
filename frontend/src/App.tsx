import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Composants de mise en page
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import TimerPopup from './components/timer/TimerPopup';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import TaskForm from './pages/TaskForm';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import ClientDashboard from './pages/ClientDashboard';
import Gamification from './pages/Gamification';
import Profile from './pages/Profile';
import TestApi from './pages/TestApi';
import TestLogin from './TestLogin';
import AdminSetup from './AdminSetup';

const App: React.FC = () => {
  return (
    <>
      {/* Le timer est toujours disponible, indépendamment des routes */}
      <TimerPopup />

      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/test-api" element={<TestApi />} />
        <Route path="/test-login" element={<TestLogin />} />
        <Route path="/admin-setup" element={<AdminSetup />} />

        {/* Routes privées avec layout */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/new" element={<ClientForm />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/new" element={<TaskForm />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/dashboard/clients" element={<ClientDashboard />} />
            <Route path="/gamification" element={<Gamification />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default App;
