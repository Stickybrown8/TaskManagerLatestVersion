/*
 * OUTIL DE DÉBOGAGE DU CHRONOMÈTRE - frontend/src/components/debug/TimerDebug.tsx
 *
 * Explication simple:
 * Ce fichier crée une petite fenêtre qui s'affiche dans le coin supérieur gauche
 * de l'écran et montre l'état actuel du chronomètre. C'est comme un tableau de bord
 * pour les développeurs qui leur permet de voir ce qui se passe avec le chronomètre
 * et de l'activer ou le désactiver rapidement pour tester son fonctionnement.
 *
 * Explication technique:
 * Composant React fonctionnel de débogage qui expose l'état Redux du timer
 * dans une interface visuelle persistante, permettant l'inspection en temps réel
 * et la manipulation directe des propriétés du store liées au timer.
 *
 * Où ce fichier est utilisé:
 * Incorporé temporairement pendant le développement dans les layouts ou
 * les pages principales pour surveiller et déboguer le comportement du chronomètre
 * en temps réel, mais généralement retiré en production.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks personnalisés depuis '../../hooks'
 * - Interagit avec le store Redux via l'action toggleTimerPopup du slice timerSlice
 * - S'intègre généralement dans App.tsx ou MainLayout.tsx pour les tests
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour créer notre petit tableau de bord de débogage.
// Explication technique : Importation de React core, des hooks Redux typés et de l'action creator spécifique pour manipuler la visibilité du popup du timer.
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { toggleTimerPopup } from '../../store/slices/timerSlice';
// === Fin : Importation des dépendances ===

// === Début : Définition du composant fonction ===
// Explication simple : On crée notre tableau de bord spécial qui va s'afficher sur l'écran pour nous aider à tester le chronomètre.
// Explication technique : Déclaration du composant fonctionnel React avec typage TypeScript explicite, qui servira de panneau de contrôle et de visualisation pour l'état du timer.
const TimerDebug: React.FC = () => {
// === Fin : Définition du composant fonction ===

  // === Début : Configuration des hooks Redux ===
  // Explication simple : On prépare notre outil pour parler au "cerveau" de l'application et on récupère toutes les informations sur le chronomètre.
  // Explication technique : Initialisation du dispatch Redux pour émettre des actions et extraction de l'état complet du timer depuis le store global via le hook useAppSelector.
  const dispatch = useAppDispatch();
  const timerState = useAppSelector(state => state.timer);
  // === Fin : Configuration des hooks Redux ===
  
  // === Début : Rendu de l'interface de débogage ===
  // Explication simple : On dessine notre petit tableau de bord avec des informations sur le chronomètre et deux boutons pour l'allumer ou l'éteindre.
  // Explication technique : Rendu JSX d'un panneau flottant positionné en absolu, contenant un affichage des propriétés clés du state du timer et des boutons qui dispatchent des actions pour contrôler son état.
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      backgroundColor: 'white',
      border: '1px solid black',
      padding: '10px',
      zIndex: 9999,
      boxShadow: '0 0 10px rgba(0,0,0,0.5)'
    }}>
      <h3>Timer Debug</h3>
      <div>showTimerPopup: {String(timerState?.showTimerPopup)}</div>
      <div>timerPopupSize: {String(timerState?.timerPopupSize)}</div>
      <button 
        onClick={() => dispatch(toggleTimerPopup(true))}
        style={{marginRight: '10px', padding: '5px', backgroundColor: 'green', color: 'white'}}
      >
        Show Timer
      </button>
      <button 
        onClick={() => dispatch(toggleTimerPopup(false))}
        style={{padding: '5px', backgroundColor: 'red', color: 'white'}}
      >
        Hide Timer
      </button>
    </div>
  );
  // === Fin : Rendu de l'interface de débogage ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre outil de débogage disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Export par défaut du composant pour permettre son importation et utilisation dans d'autres modules de l'application.
export default TimerDebug;
// === Fin : Export du composant ===