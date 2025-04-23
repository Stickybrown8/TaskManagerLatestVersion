import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { hideRewardAnimation } from '../../store/slices/gamificationSlice';

const RewardAnimation: React.FC = () => {
  const dispatch = useAppDispatch();
  const { rewardAnimation } = useAppSelector(state => state.gamification);
  const { soundEnabled } = useAppSelector(state => state.ui);

  // Masquer l'animation après un délai
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

  // Fonction pour jouer un son en fonction du type de récompense
  const playRewardSound = (type: string | null) => {
    // Implémentation à venir avec des sons réels
    console.log(`Playing sound for ${type}`);
  };

  if (!rewardAnimation.show) {
    return null;
  }

  // Animations différentes selon le type de récompense
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
};

export default RewardAnimation;
