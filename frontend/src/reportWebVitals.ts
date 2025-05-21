// === Ce fichier est un outil qui mesure à quelle vitesse ton site web se charge === /workspaces/TaskManagerLatestVersion/frontend/src/reportWebVitals.ts
// Explication simple : Ce fichier est comme un chronomètre qui mesure combien de temps ton site met à s'afficher et à réagir aux clics - il aide à savoir si ton application est rapide ou lente pour les utilisateurs.
// Explication technique : Module utilitaire TypeScript qui configure la collecte des métriques Web Vitals (CLS, FID, FCP, LCP, TTFB) pour mesurer les performances perçues par l'utilisateur.
// Utilisé dans : Généralement importé et appelé dans index.tsx pour démarrer la mesure des performances lors du chargement initial de l'application.
// Connecté à : Bibliothèque 'web-vitals' qu'il importe, services d'analyse comme Google Analytics où les métriques peuvent être envoyées, et indirectement à index.tsx qui l'appelle.

import { ReportHandler } from 'web-vitals';

// === Début : Fonction de reporting des métriques de performance ===
// Explication simple : Cette fonction est comme un observateur qui regarde comment ton site web se comporte et envoie ces informations à un autre endroit où tu peux les étudier, comme quand un docteur prend tes mesures pour voir si tu es en bonne santé.
// Explication technique : Fonction asynchrone qui accepte un callback optionnel et, si valide, charge dynamiquement la bibliothèque web-vitals puis enregistre les différentes métriques de performance clés via ce callback quand elles deviennent disponibles.
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};
// === Fin : Fonction de reporting des métriques de performance ===

export default reportWebVitals;
