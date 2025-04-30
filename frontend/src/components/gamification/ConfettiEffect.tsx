// frontend/src/components/gamification/ConfettiEffect.tsx

/**
 * Composant ConfettiEffect
 * ATTENTION : Le nombre de particules est limité à 150 par sécurité pour la performance.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../hooks';

interface ConfettiProps {
  show: boolean;
  duration?: number;
  particleCount?: number;
  onComplete?: () => void;
}

type ConfettiParticle = {
  x: number;
  delay: number;
  duration: number;
  rotate: number;
  scale: number;
  color: string;
  shape: React.CSSProperties;
};

const confettiColors = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B72AA',
  '#4ECDC4', '#FF9F1C', '#A594F9', '#FF5A5F', '#75D701'
];

const ConfettiEffect: React.FC<ConfettiProps> = ({
  show,
  duration = 3000,
  particleCount = 100,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const { soundEnabled } = useAppSelector(state => state.ui || { soundEnabled: true });
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  // Limite le nombre max de particules à 150 pour la performance
  const safeParticleCount = Math.min(particleCount, 150);

  // Génère les particules (extraction dans une fonction pour la réutiliser)
  const generateParticles = useCallback(() => {
    if (typeof window === 'undefined') return [];
    const width = window.innerWidth;
    return Array.from({ length: safeParticleCount }).map(() => {
      let shape: React.CSSProperties;
      const r = Math.random();
      if (r > 0.7) {
        shape = { borderRadius: '0%', transform: 'rotate(45deg)' }; // Carré
      } else if (r > 0.5) {
        shape = { borderRadius: '50%' }; // Cercle
      } else {
        shape = { borderRadius: '50% 0 50% 0' }; // Forme spéciale
      }
      return {
        x: Math.random() * width,
        delay: Math.random() * 0.5,
        duration: Math.random() * 2 + 1,
        rotate: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        shape
      };
    });
  }, [safeParticleCount]);

  // Debounce pour le resize
  const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (show && typeof window !== 'undefined') {
      setParticles(generateParticles());
    }
    // Ajoute un écouteur pour resize avec debounce
    const handleResize = () => {
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
      resizeTimeout.current = setTimeout(() => {
        if (show) setParticles(generateParticles());
      }, 150); // attend 150ms après le dernier resize
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current);
    };
  }, [show, generateParticles, safeParticleCount]); // Ajout de safeParticleCount ici

  useEffect(() => {
    setIsVisible(show);

    if (show) {
      if (soundEnabled) {
        playConfettiSound();
      }
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
      const audio = new Audio('/sounds/celebration.mp3');
      audio.volume = 0.5;
      audio.play().catch(e =>
        console.log('[ConfettiEffect] Impossible de jouer le son :', e)
      );
    } catch (error) {
      console.log('[ConfettiEffect] Erreur lors de la lecture du son :', error);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        aria-hidden="true"
      >
        {/* Génération des particules de confettis */}
        {particles.map((p, i) => (
          <motion.div
            key={i}
            initial={{
              x: p.x,
              y: -20,
              rotate: p.rotate,
              opacity: 1,
              scale: p.scale
            }}
            animate={{
              y: typeof window !== 'undefined' ? window.innerHeight + 20 : 700,
              opacity: 0
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'easeOut'
            }}
            className="absolute w-3 h-3"
            style={{
              backgroundColor: p.color,
              ...p.shape
            }}
          />
        ))}
      </div>
    </AnimatePresence>
  );
};

export default ConfettiEffect;