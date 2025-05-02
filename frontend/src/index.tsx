import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { store } from './store';
import './index.css';

// Composant ErrorBoundary pour capturer les erreurs
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';

// Point d'entrée principal de l'application
const root = createRoot(document.getElementById('root')!);
root.render(
  <Provider store={store}>
    <Router>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Router>
  </Provider>
);
