/*
 * ANIMATION DE RÉCOMPENSE - frontend/src/components/gamification/RewardAnimation.tsx
 *
 * Explication simple:
 * Ce fichier crée une jolie animation qui apparaît quand tu gagnes quelque chose dans
 * l'application, comme un badge, des points, ou quand tu montes de niveau. C'est comme
 * la petite fête qui se lance avec des confettis et des effets visuels pour te féliciter
 * lorsque tu réussis quelque chose d'important.
 *
 * Explication technique:
 * Composant React fonctionnel qui affiche une animation modale pour célébrer l'obtention de
 * récompenses (badges, niveaux, points, expérience), avec des effets visuels générés par
 * Framer Motion et un comportement adaptatif selon le type de récompense.
 *
 * Où ce fichier est utilisé:
 * Intégré dans le layout principal de l'application et déclenché par le store Redux
 * lorsque l'utilisateur obtient une récompense suite à ses actions dans l'application.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks Redux personnalisés depuis '../../hooks'
 * - Interagit avec le store via l'action hideRewardAnimation du slice gamificationSlice
 * - Consomme les états gamification et ui du store Redux
 * - Utilise Framer Motion pour les animations
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour créer notre animation de récompense, comme quand tu rassembles tes crayons et papiers avant de dessiner.
// Explication technique : Importation de React et useEffect pour la gestion du cycle de vie, framer-motion pour les animations, et des hooks Redux personnalisés pour interagir avec le store global.
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { hideRewardAnimation } from '../../store/slices/gamificationSlice';
// === Fin : Importation des dépendances ===

// === Début : Définition du composant fonction principal ===
// Explication simple : On crée notre animation spéciale qui va montrer différentes sortes de récompenses avec des effets jolis et colorés.
// Explication technique : Définition du composant fonctionnel React avec typage TypeScript, qui servira de conteneur pour l'animation des récompenses.
const RewardAnimation: React.FC = () => {
// === Fin : Définition du composant fonction principal ===

  // === Début : Initialisation des hooks Redux ===
  // Explication simple : On prépare ce qu'il faut pour parler avec le "cerveau" de l'application et récupérer les informations sur la récompense à afficher.
  // Explication technique : Configuration du dispatcher Redux et extraction des données pertinentes depuis le store global avec useAppSelector pour accéder aux états des slices gamification et ui.
  const dispatch = useAppDispatch();
  const { rewardAnimation } = useAppSelector(state => state.gamification);
  const { soundEnabled } = useAppSelector(state => state.ui);
  // === Fin : Initialisation des hooks Redux ===

  // === Début : Effet pour gérer l'affichage temporisé de l'animation ===
  // Explication simple : Cette partie fait en sorte que l'animation ne reste pas affichée trop longtemps. Elle disparaît automatiquement après quelques secondes, comme un feu d'artifice qui s'éteint.
  // Explication technique : Hook useEffect qui déclenche un timer pour masquer l'animation après 3 secondes et gère conditionnellement la lecture audio en fonction des préférences utilisateur.
  useEffect(() => {
    if (rewardAnimation.show) {
      const timer = setTimeout(() => {
        dispatch(hideRewardAnimation());
      }, 3000);
      
      // Jouer un son si activé
      if (soundEnabled) {
        playRewardSound(rewardAnimation.type);
      }
      
      return () => clearTimeout(timer);
    }
  }, [rewardAnimation.show, dispatch, soundEnabled]);
  // === Fin : Effet pour gérer l'affichage temporisé de l'animation ===

  // === Début : Fonction de gestion des sons ===
  // Explication simple : Cette fonction jouerait un son joyeux quand tu reçois ta récompense, différent selon ce que tu as gagné, comme une petite musique de victoire.
  // Explication technique : Fonction utilitaire qui gère la lecture audio en fonction du type de récompense obtenue, actuellement implémentée comme un placeholder avec logging console.
  const playRewardSound = (type: string | null) => {
    // Implémentation à venir avec des sons réels
    console.log(`Playing sound for ${type}`);
  };
  // === Fin : Fonction de gestion des sons ===

  // === Début : Rendu conditionnel - Vérification d'affichage ===
  // Explication simple : Si aucune récompense n'est à montrer, alors on n'affiche rien du tout.
  // Explication technique : Guard clause qui retourne null si l'état show est false, empêchant tout rendu du composant lorsqu'aucune récompense n'est active.
  if (!rewardAnimation.show) {
    return null;
  }
  // === Fin : Rendu conditionnel - Vérification d'affichage ===

  // === Début : Fonction de rendu conditionnel selon le type de récompense ===
  // Explication simple : Cette fonction décide quelle sorte d'animation montrer en fonction de ce que tu as gagné : un badge, un niveau, des points ou de l'expérience.
  // Explication technique : Fonction complexe qui utilise un switch statement pour générer différents JSX basés sur le type de récompense, chacun avec ses propres animations Framer Motion et structure visuelle adaptée.
  const renderRewardContent = () => {
    switch (rewardAnimation.type) {
      case 'badge':
        const badge = rewardAnimation.data;
        return (
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="mb-4"
            >
              <img 
                src={badge.icon} 
                alt={badge.name} 
                className="w-24 h-24 object-contain"
              />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-center mb-2"
            >
              Nouveau badge obtenu !
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-center"
            >
              {badge.name}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-center text-gray-600 dark:text-gray-300 mt-2"
            >
              {badge.description}
            </motion.p>
          </div>
        );
        
      case 'level':
        const { level } = rewardAnimation.data;
        return (
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="mb-4 bg-secondary-500 text-white rounded-full w-24 h-24 flex items-center justify-center text-4xl font-bold"
            >
              {level}
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-center mb-2"
            >
              Niveau supérieur !
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-center"
            >
              Vous avez atteint le niveau {level}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-center text-gray-600 dark:text-gray-300 mt-2"
            >
              De nouvelles fonctionnalités sont débloquées !
            </motion.p>
          </div>
        );
        
      case 'points':
        const { points } = rewardAnimation.data;
        return (
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ times: [0, 0.7, 1], duration: 0.8 }}
              className="mb-4 flex items-center"
            >
              <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">+{points}</span>
              <svg className="w-10 h-10 ml-2 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-center mb-2"
            >
              Points d'action gagnés !
            </motion.h2>
          </div>
        );
        
      case 'experience':
        const { experience } = rewardAnimation.data;
        return (
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ times: [0, 0.7, 1], duration: 0.8 }}
              className="mb-4 flex items-center"
            >
              <span className="text-4xl font-bold text-secondary-600 dark:text-secondary-400">+{experience}</span>
              <svg className="w-10 h-10 ml-2 text-secondary-600 dark:text-secondary-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-center mb-2"
            >
              Expérience gagnée !
            </motion.h2>
          </div>
        );
        
      default:
        return (
          <div className="flex flex-col items-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-center"
            >
              Récompense obtenue !
            </motion.h2>
          </div>
        );
    }
  };
  // === Fin : Fonction de rendu conditionnel selon le type de récompense ===

  // === Début : Rendu principal du composant ===
  // Explication simple : C'est la partie qui affiche vraiment l'animation sur l'écran, avec un fond sombre, une boîte blanche au milieu, et plein de confettis colorés qui tombent pour célébrer.
  // Explication technique : Rendu JSX principal qui crée un modal animé avec overlay semi-transparent, contenu dynamique basé sur le type de récompense, et effet de confettis généré dynamiquement avec des animations individuelles pour chaque particule.
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={() => dispatch(hideRewardAnimation())}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        {renderRewardContent()}
        
        {/* Confettis et effets visuels */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
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
      </motion.div>
    </motion.div>
  );
  // === Fin : Rendu principal du composant ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre animation disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules de l'application.
export default RewardAnimation;
// === Fin : Export du composant ===
