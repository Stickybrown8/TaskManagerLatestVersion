import React from 'react';
import './App.css';

// Définir explicitement le type des props pour inclure children
interface AppProps {
  children?: React.ReactNode;
}

// Note: Ce fichier ne doit PAS contenir de routes,
// toutes les routes sont maintenant dans index.tsx
const App: React.FC<AppProps> = ({ children }) => {
  return (
    <div className="App">
      {children}
    </div>
  );
};

export default App;
