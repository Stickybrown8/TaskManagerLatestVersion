/*
 * BOUTON DE BASCULEMENT DU MODE SOMBRE - frontend/src/components/DarkModeToggle.tsx
 *
 * Explication simple:
 * Ce fichier crée un bouton qui te permet de changer l'apparence de l'application entre
 * mode clair (fond blanc, texte noir) et mode sombre (fond noir, texte blanc). C'est comme
 * un interrupteur de lumière pour l'application! Quand tu cliques dessus, toutes les couleurs
 * changent pour être plus douces pour tes yeux la nuit.
 *
 * Explication technique:
 * Composant React fonctionnel qui implémente un bouton de basculement du mode sombre/clair,
 * utilisant le store Redux pour persister la préférence et manipulant les classes CSS du
 * document HTML pour appliquer les styles adaptés via Tailwind CSS.
 *
 * Où ce fichier est utilisé:
 * Intégré dans le header ou la barre de navigation principale de l'application, permettant
 * à l'utilisateur de changer le thème global de l'interface depuis n'importe quelle page.
 *
 * Connexions avec d'autres fichiers:
 * - Interagit avec le store Redux via les hooks personnalisés depuis '../hooks'
 * - Utilise l'action toggleDarkMode du slice '../store/slices/uiSlice'
 * - Modifie directement les classes du document HTML pour activer les styles Tailwind dark:
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour faire fonctionner notre bouton d'interrupteur de lumière, comme quand tu rassembles tes jouets avant de commencer à jouer.
// Explication technique : Importation des bibliothèques React core, des hooks Redux personnalisés et de l'action pour manipuler le mode sombre dans le store global.
import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { toggleDarkMode } from '../store/slices/uiSlice';
// === Fin : Importation des dépendances ===

// === Début : Définition du composant principal ===
// Explication simple : On crée le bouton spécial qui pourra allumer ou éteindre la lumière dans toute l'application.
// Explication technique : Déclaration du composant fonctionnel React avec typage TypeScript explicite, qui encapsule la logique de basculement du mode sombre.
const DarkModeToggle: React.FC = () => {
// === Fin : Définition du composant principal ===

  // === Début : Initialisation des hooks Redux ===
  // Explication simple : On prépare deux choses importantes : un messager qui va envoyer l'ordre de changer la lumière, et un détecteur qui nous dit si la lumière est actuellement allumée ou éteinte.
  // Explication technique : Configuration du dispatcher Redux pour émettre des actions et utilisation du sélecteur pour extraire l'état actuel du mode sombre depuis le store, avec gestion des valeurs par défaut.
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector(state => state.ui?.darkMode) || false;
  // === Fin : Initialisation des hooks Redux ===

  // === Début : Effet pour appliquer le mode visuel ===
  // Explication simple : Cette partie s'assure que quand tu dis "je veux le mode nuit", toute l'application devient vraiment sombre, et quand tu dis "je veux le mode jour", elle redevient claire.
  // Explication technique : Hook useEffect qui observe les changements de l'état darkMode et manipule en conséquence les classes CSS du document HTML racine pour activer ou désactiver les styles Tailwind dark:.
  // Appliquer le mode sombre/clair au document HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  // === Fin : Effet pour appliquer le mode visuel ===

  // === Début : Fonction de basculement du mode ===
  // Explication simple : Cette fonction est comme l'interrupteur que tu appuies pour allumer ou éteindre la lumière. Elle change l'état et s'assure que le changement est bien appliqué tout de suite.
  // Explication technique : Gestionnaire d'événement qui dispatch l'action Redux pour basculer le mode, log le changement pour débogage, et applique immédiatement la modification des classes CSS pour éviter tout délai visuel.
  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
    
    // Ajouter un log pour déboguer
    console.log("DarkMode toggled:", !darkMode);
    
    // Forcer l'application de la classe pour le mode sombre sur le document
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  // === Fin : Fonction de basculement du mode ===

  // === Début : Rendu du bouton d'interface ===
  // Explication simple : C'est l'apparence visuelle de notre bouton, avec une icône de soleil quand il fait sombre et une icône de lune quand il fait clair, pour t'indiquer sur quel mode tu vas basculer si tu cliques.
  // Explication technique : Rendu JSX du bouton qui déclenche le gestionnaire de basculement au clic, avec styling conditionnel via Tailwind et affichage d'icônes SVG différentes selon l'état actuel du mode.
  return (
    <button
      onClick={handleToggleDarkMode}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
      title={darkMode ? "Passer au mode clair" : "Passer au mode sombre"}
    >
      {darkMode ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
  // === Fin : Rendu du bouton d'interface ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre bouton disponible pour que d'autres parties de l'application puissent l'utiliser, comme quand tu partages ton jouet avec tes amis.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules de l'application.
export default DarkModeToggle;
// === Fin : Export du composant ===
