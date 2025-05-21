// === Ce fichier vérifie si l'application fonctionne correctement === /workspaces/TaskManagerLatestVersion/frontend/src/App.test.tsx
// Explication simple : Ce fichier est comme un inspecteur qui vérifie si ton application s'affiche correctement - il s'assure que les boutons et textes importants sont bien visibles pour les utilisateurs.
// Explication technique : Fichier de test unitaire React utilisant Jest et React Testing Library pour valider le rendu du composant principal App.
// Utilisé dans : Suite de tests automatisés, exécuté lors des commandes "npm test" ou pendant l'intégration continue.
// Connecté à : App.tsx qu'il importe et teste, et aux bibliothèques de test (@testing-library/react) qui fournissent les outils d'analyse.

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// === Début : Test de rendu du composant App ===
// Explication simple : Ce petit programme vérifie si l'application affiche bien le texte "learn react" quelque part à l'écran - comme quand tu vérifies qu'un livre contient bien une phrase particulière.
// Explication technique : Fonction de test Jest qui utilise React Testing Library pour rendre le composant App dans un environnement virtuel, puis recherche un élément textuel correspondant à l'expression régulière /learn react/i et vérifie sa présence dans le DOM.
test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
// === Fin : Test de rendu du composant App ===
