import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { store } from './store';
// Ajoutez l'import pour le nouveau composant ClientForm
import ClientForm from './pages/ClientForm';
import './index.css';

// Composant ErrorBoundary pour capturer les erreurs
import ErrorBoundary from './components/ErrorBoundary';

// Composants de mise en page
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import TimerPopup from './components/timer/TimerPopup';
import App from './App';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Clients from './pages/Clients';
import Gamification from './pages/Gamification';
import TestApi from './pages/TestApi';
import TestLogin from './TestLogin';
import AdminSetup from './AdminSetup';

const Root = () => {
  return (
    <ErrorBoundary>
      <App>
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
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/gamification" element={<Gamification />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </App>
    </ErrorBoundary>
  );
};

// Point d'entrée principal de l'application
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <Router>
          <Root />
        </Router>
      </Provider>
    </React.StrictMode>
  );
} else {
  console.error("L'élément avec l'ID 'root' n'a pas été trouvé dans le DOM");
}
