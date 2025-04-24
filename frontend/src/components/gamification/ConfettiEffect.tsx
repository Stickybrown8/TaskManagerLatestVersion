import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../hooks';

interface ConfettiProps {
  show: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

const ConfettiEffect: React.FC<ConfettiProps> = ({
  show,
  duration = 3000,
  particleCount = 100,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const { soundEnabled } = useAppSelector(state => state.ui || { soundEnabled: true });

  // Gérer l'affichage et la disparition automatique des confettis
  useEffect(() => {
    setIsVisible(show);
    
    if (show) {
      // Jouer un son de célébration si le son est activé
      if (soundEnabled) {
        playConfettiSound();
      }
      
      // Masquer les confettis après la durée spécifiée
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete, soundEnabled]);
  
  // Fonction pour jouer un son de célébration
  const playConfettiSound = () => {
    try {
      // Vous pouvez remplacer ceci par votre propre son
      const audio = new Audio('/sounds/celebration.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Impossible de jouer le son:', e));
    } catch (error) {
      console.log('Erreur lors de la lecture du son:', error);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Génération des particules de confettis */}
        {Array.from({ length: particleCount }).map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * window.innerWidth,
              y: -20,
              rotate: Math.random() * 360,
              opacity: 1,
              scale: Math.random() * 0.5 + 0.5
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
                '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B72AA',
                '#4ECDC4', '#FF9F1C', '#A594F9', '#FF5A5F', '#75D701'
              ][Math.floor(Math.random() * 10)],
              // Varier la forme pour plus de diversité
              ...(Math.random() > 0.7 
                ? { borderRadius: '0%', transform: 'rotate(45deg)' } // Carrés
                : Math.random() > 0.5 
                  ? { borderRadius: '50%' } // Cercles
                  : { borderRadius: '50% 0 50% 0' }) // Formes spéciales
            }}
          />
        ))}
      </div>
    </AnimatePresence>
  );
};

export default ConfettiEffect;
