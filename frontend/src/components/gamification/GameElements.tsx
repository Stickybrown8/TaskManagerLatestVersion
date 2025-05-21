/*
 * ÉLÉMENTS DE GAMIFICATION - frontend/src/components/gamification/GameElements.tsx
 *
 * Explication simple:
 * Ce fichier contient tous les petits éléments amusants qui rendent l'application plus 
 * engageante, comme des confettis qui tombent quand tu réussis quelque chose, des conseils 
 * qui apparaissent pour t'aider, et des récompenses quotidiennes qui te donnent des points 
 * quand tu reviens chaque jour. C'est comme les petites surprises et les cadeaux qui te 
 * donnent envie de continuer à utiliser l'application.
 *
 * Explication technique:
 * Composant React fonctionnel qui regroupe divers éléments de gamification UI (confettis,
 * récompenses quotidiennes, conseils contextuels et indicateurs de progression), utilisant
 * Framer Motion pour les animations et s'intégrant avec le store Redux pour la gestion d'état.
 *
 * Où ce fichier est utilisé:
 * Intégré dans le layout principal de l'application pour que ces éléments soient disponibles
 * globalement sur toutes les pages, déclenché par divers événements utilisateur.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks Redux personnalisés depuis '../../hooks'
 * - Accède aux états de gamification et UI dans le store Redux
 * - Dispatch l'action 'addNotification' du slice UI
 * - Utilise Framer Motion pour les animations
 * - Interagit avec localStorage pour le suivi des connexions quotidiennes
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour créer nos animations et interagir avec le "cerveau" de l'application.
// Explication technique : Importation de React et ses hooks, des hooks Redux personnalisés pour accéder au store, de Framer Motion pour les animations, et de l'action creator pour les notifications.
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { addNotification } from '../../store/slices/uiSlice';
// === Fin : Importation des dépendances ===

// === Début : Composant de confettis ===
// Explication simple : Ce mini-programme fait tomber plein de petits morceaux de papier colorés depuis le haut de l'écran quand quelque chose de bien arrive, comme pendant une fête.
// Explication technique : Composant fonctionnel qui génère 100 particules animées avec des propriétés aléatoires (position, rotation, couleur) utilisant Framer Motion pour créer une animation de confettis qui tombe du haut vers le bas de l'écran.
// Composant pour les confettis
const Confetti: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 100 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: -20,
            rotate: Math.random() * 360,
            opacity: 1
          }}
          animate={{
            y: window.innerHeight + 20,
            opacity: 0
          }}
          transition={{
            duration: Math.random() * 2 + 1,
            delay: Math.random() * 0.5,
            ease: 'easeOut'
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: [
              '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B72AA'
            ][Math.floor(Math.random() * 5)]
          }}
        />
      ))}
    </div>
  );
};
// === Fin : Composant de confettis ===

// === Début : Composant principal GameElements ===
// Explication simple : C'est le programme principal qui s'occupe de toutes les choses amusantes dans l'application : les confettis, les cadeaux quotidiens, les conseils utiles et l'affichage de ton score.
// Explication technique : Composant fonctionnel React qui orchestre différents éléments d'UI de gamification, gérant leur état et leur logique d'affichage via des hooks d'état local et Redux.
// Composant pour les animations de récompenses
const GameElements: React.FC = () => {
  // === Début : Initialisation des hooks et sélection d'état Redux ===
  // Explication simple : On prépare notre outil pour parler avec le "cerveau" de l'application et on récupère toutes les informations dont on a besoin sur le joueur.
  // Explication technique : Initialisation du dispatcher Redux et extraction de données pertinentes du store via useAppSelector pour accéder aux états de gamification et de préférences UI.
  const dispatch = useAppDispatch();
  const { level, actionPoints, badges } = useAppSelector((state) => state.gamification);
  const { darkMode, soundEnabled } = useAppSelector((state) => state.ui);
  // === Fin : Initialisation des hooks et sélection d'état Redux ===

  // === Début : Configuration des états locaux ===
  // Explication simple : On crée des "interrupteurs" pour contrôler quand afficher les confettis, les récompenses et les conseils, et des "boîtes" pour stocker les informations à montrer.
  // Explication technique : Définition des états locaux avec useState pour gérer la visibilité des différents composants de gamification et stocker leurs données associées.
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyReward, setDailyReward] = useState({ points: 0, message: '' });
  const [showTip, setShowTip] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  // === Fin : Configuration des états locaux ===

  // === Début : Définition des conseils ===
  // Explication simple : On crée une liste de tous les conseils utiles qu'on pourra afficher au joueur pour l'aider.
  // Explication technique : Tableau statique contenant un ensemble de conseils prédéfinis qui seront affichés de manière aléatoire à l'utilisateur via le système de tips.
  // Liste des conseils à afficher
  const tips = [
    "Complétez des tâches pour gagner des points d'action !",
    "Connectez-vous chaque jour pour maintenir votre streak !",
    "Les tâches urgentes rapportent plus de points !",
    "Montez de niveau pour débloquer de nouvelles fonctionnalités !",
    "Organisez vos tâches par priorité pour être plus efficace !",
    "Complétez des défis pour gagner des badges spéciaux !",
    "Utilisez les filtres pour retrouver rapidement vos tâches !",
    "Ajoutez des sous-tâches pour décomposer les tâches complexes !",
    "Consultez régulièrement votre page de gamification pour suivre votre progression !",
    "Les badges rares sont plus difficiles à obtenir mais rapportent plus d'expérience !"
  ];
  // === Fin : Définition des conseils ===

  // === Début : Fonction de gestion des sons ===
  // Explication simple : Cette fonction joue un son joyeux quand quelque chose d'important se passe, mais seulement si le joueur a activé les sons.
  // Explication technique : Fonction utilitaire qui simule la lecture d'effets sonores en fonction du type d'événement, avec vérification préalable des préférences utilisateur.
  // Effets sonores (simulés)
  const playSound = (type: string) => {
    if (!soundEnabled) return;

    console.log(`Playing sound: ${type}`);
    // Ici, on pourrait implémenter de vrais sons avec la Web Audio API
  };
  // === Fin : Fonction de gestion des sons ===

  // === Début : Vérification des récompenses quotidiennes ===
  // Explication simple : Ce programme vérifie si c'est la première fois que tu utilises l'application aujourd'hui, et si oui, te donne une récompense surprise comme cadeau de bienvenue.
  // Explication technique : Hook d'effet qui s'exécute au montage pour vérifier si l'utilisateur se connecte pour la première fois de la journée, attribution de points aléatoires comme récompense quotidienne et mise à jour du localStorage.
  // Vérifier si c'est la première connexion de la journée
  useEffect(() => {
    const checkDailyReward = () => {
      const lastLogin = localStorage.getItem('lastLogin');
      const today = new Date().toDateString();

      if (!lastLogin || lastLogin !== today) {
        // Première connexion de la journée
        const points = Math.floor(Math.random() * 10) + 5; // Entre 5 et 15 points
        setDailyReward({
          points,
          message: `Bienvenue ! Voici votre récompense quotidienne de ${points} points d'action.`
        });
        setShowDailyReward(true);
        playSound('daily_reward');

        // Enregistrer la date de connexion
        localStorage.setItem('lastLogin', today);
      }
    };

    // Vérifier après un court délai pour ne pas interférer avec le chargement initial
    const timer = setTimeout(checkDailyReward, 2000);
    return () => clearTimeout(timer);
  }, []);
  // === Fin : Vérification des récompenses quotidiennes ===

  // === Début : Gestion de l'affichage des conseils ===
  // Explication simple : Ce programme choisit un conseil au hasard dans notre liste et le montre de temps en temps, comme un ami qui te donnerait un coup de pouce.
  // Explication technique : Hook d'effet qui configure des intervalles pour afficher périodiquement un conseil aléatoire à l'utilisateur, avec gestion du timing d'affichage et de disparition.
  // Afficher un conseil aléatoire périodiquement
  useEffect(() => {
    const showRandomTip = () => {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setCurrentTip(randomTip);
      setShowTip(true);

      // Masquer le conseil après quelques secondes
      setTimeout(() => {
        setShowTip(false);
      }, 5000);
    };

    // Afficher un conseil toutes les 5 minutes
    const interval = setInterval(showRandomTip, 300000);

    // Afficher un premier conseil après 30 secondes
    const initialTip = setTimeout(showRandomTip, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTip);
    };
  }, []);
  // === Fin : Gestion de l'affichage des conseils ===

  // === Début : Fonction de gestion des récompenses quotidiennes ===
  // Explication simple : Cette fonction s'active quand tu cliques sur "Réclamer" pour ta récompense quotidienne. Elle fait disparaître le message, fait apparaître des confettis, et t'envoie une notification pour confirmer ton cadeau.
  // Explication technique : Gestionnaire d'événement qui traite la réclamation de la récompense quotidienne, déclenchant les confettis, envoyant une notification via Redux et jouant un son de récompense.
  // Gérer la fermeture de la récompense quotidienne
  const handleClaimDailyReward = () => {
    setShowDailyReward(false);
    setShowConfetti(true);

    // Notification de récompense
    dispatch(addNotification({
      message: `Vous avez reçu ${dailyReward.points} points d'action !`,
      type: 'success'
    }));

    // Masquer les confettis après quelques secondes
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    playSound('claim_reward');
  };
  // === Fin : Fonction de gestion des récompenses quotidiennes ===

  // === Début : Rendu du composant principal ===
  // Explication simple : C'est la partie qui dessine tout sur l'écran : les confettis quand tu réussis quelque chose, la boîte de récompense quotidienne, les conseils utiles, et les petits badges qui montrent ton niveau et tes points.
  // Explication technique : Structure JSX principale qui rend conditionnellement les différents éléments de gamification en fonction de leur état de visibilité, utilisant Framer Motion pour les animations d'entrée et de sortie.
  return (
    <>
      {/* Confettis */}
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>

      {/* Récompense quotidienne */}
      <AnimatePresence>
        {showDailyReward && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm z-50"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-full p-2">
                <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Récompense quotidienne</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{dailyReward.message}</p>
                <div className="mt-3">
                  <button
                    onClick={handleClaimDailyReward}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
                  >
                    Réclamer
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conseil */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-20 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 max-w-xs z-40"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 text-yellow-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2 flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-300">{currentTip}</p>
              </div>
              <button
                onClick={() => setShowTip(false)}
                className="flex-shrink-0 ml-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicateur de niveau flottant */}
      <div className="fixed bottom-4 left-4 z-40">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center space-x-2 p-2 rounded-full shadow-lg ${darkMode
              ? 'bg-gray-800 text-white'
              : 'bg-white text-gray-900'
            }`}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-500 text-white font-bold">
            {level}
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white font-bold">
            {actionPoints}
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white font-bold">
            {badges.length}
          </div>
        </motion.div>
      </div>
    </>
  );
  // === Fin : Rendu du composant principal ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre programme disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Export par défaut du composant principal pour permettre son importation dans d'autres modules de l'application.
export default GameElements;
// === Fin : Export du composant ===