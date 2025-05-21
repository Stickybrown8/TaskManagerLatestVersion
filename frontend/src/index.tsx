// === Ce fichier est le point de départ principal qui lance toute l'application === /workspaces/TaskManagerLatestVersion/frontend/src/index.tsx
// Explication simple : Ce fichier est comme l'interrupteur principal qui allume l'application - il connecte tous les grands morceaux ensemble et les attache à la page web pour que tout fonctionne.
// Explication technique : Point d'entrée TypeScript principal de l'application React qui initialise le rendu, connecte Redux, React Router et les composants racine au DOM.
// Utilisé dans : C'est le fichier de démarrage principal appelé automatiquement par l'environnement de build (webpack/vite) lors du chargement de l'application.
// Connecté à : App.tsx (composant racine), store/index.ts (store Redux), ErrorBoundary (gestion d'erreurs) et indirectement à tous les composants de l'application.

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { store, resetStore } from './store';
import './index.css';

// Composant ErrorBoundary pour capturer les erreurs
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';

// === Début : Réinitialisation du store Redux ===
// Explication simple : Cette ligne appuie sur le bouton "Recommencer" du cerveau de l'application pour s'assurer que toutes les informations sont fraîches au démarrage, comme quand tu redémarres un jeu pour commencer une nouvelle partie.
// Explication technique : Appel à la fonction utilitaire qui dispatch une action spéciale pour réinitialiser l'état du store Redux à ses valeurs initiales, garantissant un état propre au démarrage de l'application.
// Réinitialiser le store au démarrage
resetStore();
// === Fin : Réinitialisation du store Redux ===

// === Début : Création du point d'entrée React ===
// Explication simple : Ces lignes trouvent l'endroit spécial dans la page web (la div avec id="root") où l'application va s'installer, comme quand tu trouves le bon endroit pour planter une graine.
// Explication technique : Utilisation de l'API createRoot de React 18 pour initialiser le conteneur de rendu en ciblant l'élément DOM avec l'id "root", avec l'assertion TypeScript non-null (!) garantissant que l'élément existe.
// Point d'entrée principal de l'application
const root = createRoot(document.getElementById('root')!);
// === Fin : Création du point d'entrée React ===

// === Début : Rendu de l'application avec ses providers ===
// Explication simple : Cette grande section construit une série de boîtes imbriquées autour de ton application - d'abord une boîte qui vérifie les bugs, puis une boîte qui permet la navigation, puis une boîte qui fournit des données, et enfin ton application au milieu.
// Explication technique : Fonction render qui compose l'arbre de composants React avec les différents providers nécessaires (StrictMode pour le débogage, Provider pour Redux, Router pour la navigation, ErrorBoundary pour la gestion d'erreurs) entourant le composant App central.
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Router>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </Router>
    </Provider>
  </React.StrictMode>
);
// === Fin : Rendu de l'application avec ses providers ===
