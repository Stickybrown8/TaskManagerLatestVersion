import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Gamification from './pages/Gamification';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import './App.css';
import TestApi from './pages/TestApi';
import TestLogin from './TestLogin';

const App = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/test-api" element={<TestApi />} />
        <Route path="/test-login" element={<TestLogin />} /> {/* Nouvelle route pour le test de connexion */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/gamification" element={<Gamification />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
};

export default App;
