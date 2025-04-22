import React from 'react';
import './App.css';

// Note: Ce fichier ne doit PAS contenir de routes,
// toutes les routes sont maintenant dans index.tsx

const App: React.FC = ({ children }) => {
  return (
    <div className="App">
      {children}
    </div>
  );
};

export default App;
