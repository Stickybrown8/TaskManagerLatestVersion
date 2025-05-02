import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import TimerPopupFix from './components/timer/TimerPopupFix';
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

const App: React.FC = () => {
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
            <Route path="*" element={<div>Page non trouvée</div>} />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default App;
