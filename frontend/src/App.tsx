import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
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
import ClientDashboard from './pages/ClientDashboard';
import Gamification from './pages/Gamification';
import Profile from './pages/Profile';
import TestApi from './pages/TestApi';
import TestLogin from './TestLogin';
import AdminSetup from './AdminSetup';
import { useAppDispatch } from './hooks';
import { loginSuccess, setRehydrated } from './store/slices/authSlice';

const App: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    let user = null;
    try {
      if (userRaw) {
        user = JSON.parse(userRaw);
      }
    } catch (e) {
      user = null;
    }
    console.log("TOKEN found:", token);
    console.log("USER parsed:", user);
    if (token && user) {
      console.log("DISPATCH loginSuccess");
      dispatch(loginSuccess({ user, token }));
    } else {
      console.log("DISPATCH setRehydrated");
      dispatch(setRehydrated());
    }
  }, [dispatch]);

  return (
    <>
      <TimerPopup />
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
