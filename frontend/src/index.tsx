import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { store } from './store';
import './index.css';

// Importations avec chemins relatifs
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import TimerPopup from './components/timer/TimerPopup';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Clients from './pages/Clients';
import Gamification from './pages/Gamification';
import TaskDetail from './pages/TaskDetail';

const App = () => {
  return (
    <div className="App">
      <TimerPopup />
      <Routes>
        <Route path="/login" element={<Login />} />
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

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <Router>
          <App />
        </Router>
      </Provider>
    </React.StrictMode>
  );
} else {
  console.error("L'élément avec l'ID 'root' n'a pas été trouvé dans le DOM");
}