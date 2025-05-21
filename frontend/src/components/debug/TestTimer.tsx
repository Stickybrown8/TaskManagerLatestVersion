/*
 * COMPOSANT DE TEST DU TIMER - frontend/src/components/debug/TestTimer.tsx
 *
 * Explication simple:
 * Ce fichier est un petit outil de test qui permet aux développeurs de vérifier si
 * le système de chronomètre fonctionne bien. Il affiche une fenêtre au milieu de l'écran
 * avec deux boutons : un vert pour faire apparaître le chronomètre et un rouge pour le faire
 * disparaître. C'est comme une télécommande simplifiée pour tester le chronomètre sans
 * avoir à passer par toute l'application.
 *
 * Explication technique:
 * Composant React fonctionnel pour le débogage qui permet de tester manuellement l'affichage
 * et la disparition du popup de chronomètre en interagissant directement avec l'état Redux,
 * sans passer par le flux normal de l'application.
 *
 * Où ce fichier est utilisé:
 * Importé manuellement pendant la phase de développement pour tester l'intégration du timer,
 * généralement dans App.tsx ou dans une page de test, mais n'est pas utilisé en production.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks personnalisés depuis '../../hooks'
 * - Interagit avec le store Redux via l'action toggleTimerPopup du slice timerSlice
 * - Ne s'affiche que quand il est explicitement importé dans un composant parent
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir les outils dont on a besoin : React pour créer notre interface, et des fonctions spéciales pour parler au "cerveau" de l'application (le store).
// Explication technique : Importation de React, des hooks Redux personnalisés et de l'action creator toggleTimerPopup du module timerSlice pour interagir avec l'état global.
// Créez un fichier TestTimer.tsx dans frontend/src/components/debug/
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { toggleTimerPopup } from '../../store/slices/timerSlice';
// === Fin : Importation des dépendances ===

// === Début : Déclaration du composant fonction ===
// Explication simple : On définit notre mini-application de test qui va afficher les boutons de contrôle du chronomètre.
// Explication technique : Déclaration d'un composant fonctionnel React avec typage TypeScript, qui servira d'interface de débogage pour le timer.
const TestTimer: React.FC = () => {
// === Fin : Déclaration du composant fonction ===

  // === Début : Utilisation des hooks Redux ===
  // Explication simple : On prépare notre outil pour pouvoir parler au "cerveau" de l'application et on récupère l'information qui nous dit si le chronomètre est visible ou non.
  // Explication technique : Initialisation du dispatcher Redux pour envoyer des actions, et extraction de l'état actuel du timer depuis le store Redux via le sélecteur.
  const dispatch = useAppDispatch();
  const showTimerPopup = useAppSelector(state => state.timer?.showTimerPopup);
  // === Fin : Utilisation des hooks Redux ===
  
  // === Début : Rendu de l'interface utilisateur ===
  // Explication simple : On crée la fenêtre de test avec les deux boutons pour contrôler le chronomètre, un peu comme une petite télécommande.
  // Explication technique : Retour du JSX qui définit l'interface utilisateur de test, positionnée au centre de l'écran avec des styles inline pour assurer la visibilité, et deux boutons qui dispatchen les actions Redux.
  return (
    <div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                 backgroundColor: 'white', padding: '20px', border: '2px solid black', zIndex: 9999}}>
      <p>État actuel: {String(showTimerPopup)}</p>
      <button 
        onClick={() => dispatch(toggleTimerPopup(true))}
        style={{padding: '10px', backgroundColor: 'green', color: 'white', marginRight: '10px'}}
      >
        Activer Timer
      </button>
      <button 
        onClick={() => dispatch(toggleTimerPopup(false))}
        style={{padding: '10px', backgroundColor: 'red', color: 'white'}}
      >
        Désactiver Timer
      </button>
    </div>
  );
  // === Fin : Rendu de l'interface utilisateur ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre outil de test disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules du projet.
export default TestTimer;
// === Fin : Export du composant ===