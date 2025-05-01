import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { store } from './store';
import './index.css';

// Composant ErrorBoundary pour capturer les erreurs
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';

const Root = () => {
  return (
    <ErrorBoundary>
      <App />
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
  console.log("App React montée !");
} else {
  console.error("L'élément avec l'ID 'root' n'a pas été trouvé dans le DOM");
}
