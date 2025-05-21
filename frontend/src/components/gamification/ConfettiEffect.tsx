/*
 * EFFET DE CONFETTIS POUR CÉLÉBRATIONS - frontend/src/components/gamification/ConfettiEffect.tsx
 *
 * Explication simple:
 * Ce fichier crée un joli effet de confettis qui tombe du haut de l'écran quand l'utilisateur
 * réussit quelque chose d'important, comme terminer une tâche ou atteindre un objectif.
 * C'est comme les confettis qu'on lance lors d'une fête pour célébrer un événement spécial,
 * mais en version numérique sur l'écran, avec un petit son de célébration en prime !
 *
 * Explication technique:
 * Composant React fonctionnel qui génère une animation de confettis en utilisant Framer Motion,
 * avec gestion d'état local pour contrôler la visibilité, la position aléatoire des particules,
 * et synchronisation audio conditionnelle basée sur les préférences utilisateur.
 *
 * Où ce fichier est utilisé:
 * Importé dans les composants qui affichent des accomplissements (TaskCompletion, LevelUp, 
 * BadgeUnlock, etc.) pour créer un feedback visuel positif lors des moments de réussite.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks personnalisés depuis '../../hooks' pour accéder au store Redux
 * - Consomme l'état soundEnabled du slice UI dans le store Redux
 * - Importe Framer Motion pour les animations
 * - Utilise un fichier audio externe '/sounds/celebration.mp3'
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir tous les outils dont on a besoin pour créer notre effet de confettis, comme quand tu prépares ton matériel avant de commencer un bricolage.
// Explication technique : Importation des hooks React nécessaires, de la bibliothèque d'animation Framer Motion et du hook Redux personnalisé pour accéder à l'état global.
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../hooks';
// === Fin : Importation des dépendances ===

// === Début : Définition des interfaces TypeScript ===
// Explication simple : On définit quelles informations notre effet de confettis peut recevoir et comment sont organisées les caractéristiques de chaque petit morceau de confetti.
// Explication technique : Déclaration des interfaces TypeScript pour typer les props du composant et la structure des particules de confettis, assurant la sécurité de type pendant le développement.
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
// === Fin : Définition des interfaces TypeScript ===

// === Début : Configuration des couleurs ===
// Explication simple : On choisit toutes les jolies couleurs pour nos confettis, comme quand tu choisis des couleurs différentes pour décorer.
// Explication technique : Tableau de valeurs hexadécimales définissant la palette de couleurs utilisée aléatoirement pour les particules de confettis.
const confettiColors = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B72AA',
  '#4ECDC4', '#FF9F1C', '#A594F9', '#FF5A5F', '#75D701'
];
// === Fin : Configuration des couleurs ===

// === Début : Déclaration du composant fonction ===
// Explication simple : On crée notre composant principal qui va afficher les confettis, en définissant ce qu'il peut faire et comment il fonctionne.
// Explication technique : Définition du composant fonctionnel React avec déstructuration des props et valeurs par défaut pour les propriétés optionnelles.
const ConfettiEffect: React.FC<ConfettiProps> = ({
  show,
  duration = 3000,
  particleCount = 100,
  onComplete
}) => {
// === Fin : Déclaration du composant fonction ===

  // === Début : Initialisation des états locaux ===
  // Explication simple : On prépare les informations que notre composant va garder en mémoire et mettre à jour : si les confettis sont visibles et comment ils sont disposés.
  // Explication technique : Utilisation du hook useState pour gérer l'état de visibilité du composant, la configuration des particules, et accès à l'état Redux pour vérifier si le son est activé.
  const [isVisible, setIsVisible] = useState(show);
  const { soundEnabled } = useAppSelector(state => state.ui || { soundEnabled: true });
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  // === Fin : Initialisation des états locaux ===

  // === Début : Configuration de sécurité pour les performances ===
  // Explication simple : On s'assure de ne pas créer trop de confettis pour que l'application reste rapide, comme quand on limite le nombre de jouets sortis en même temps.
  // Explication technique : Limitation du nombre maximal de particules à 150 pour éviter les problèmes de performance sur les appareils moins puissants.
  const safeParticleCount = Math.min(particleCount, 150);
  // === Fin : Configuration de sécurité pour les performances ===

  // === Début : Fonction de génération des particules ===
  // Explication simple : Cette fonction crée tous les petits morceaux de confettis avec des positions, couleurs et formes différentes, comme si on préparait un sac de confettis variés avant de les lancer.
  // Explication technique : Fonction mémorisée via useCallback qui génère un tableau de particules avec des propriétés aléatoires (position, délai, rotation, échelle, couleur, forme) pour créer une animation diversifiée.
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
  // === Fin : Fonction de génération des particules ===

  // === Début : Gestion du redimensionnement d'écran ===
  // Explication simple : On prépare un outil qui surveille si l'écran change de taille et qui ajuste les confettis pour qu'ils s'adaptent, mais sans le faire trop souvent pour ne pas ralentir l'application.
  // Explication technique : Référence pour stocker le timeout du debounce qui optimise la gestion du redimensionnement de fenêtre, limitant les recalculs intensifs.
  const resizeTimeout = useRef<NodeJS.Timeout | null>(null);
  // === Fin : Gestion du redimensionnement d'écran ===

  // === Début : Effet pour gérer l'affichage initial et le redimensionnement ===
  // Explication simple : Cette partie s'occupe de créer les confettis quand on demande de les afficher, et de les réorganiser si la taille de l'écran change.
  // Explication technique : Hook d'effet qui initialise les particules au montage du composant et configure un écouteur de redimensionnement avec debounce pour optimiser les performances lors des changements de taille de fenêtre.
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
  }, [show, generateParticles, safeParticleCount]);
  // === Fin : Effet pour gérer l'affichage initial et le redimensionnement ===

  // === Début : Effet pour contrôler la visibilité et le son ===
  // Explication simple : Cette partie s'occupe de rendre les confettis visibles quand on le demande, de jouer un son joyeux si c'est activé, et de les faire disparaître après un certain temps.
  // Explication technique : Hook d'effet qui synchronise l'état de visibilité avec la prop show, déclenche le son conditionnel et configure un timer pour masquer automatiquement l'animation après la durée spécifiée.
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
  // === Fin : Effet pour contrôler la visibilité et le son ===

  // === Début : Écouteur d'événements global pour les confettis ===
  // Explication simple : Cette partie permet de déclencher les confettis depuis n'importe où dans l'application, comme si on avait un bouton magique qu'on peut appuyer de loin pour lancer des confettis.
  // Explication technique : Hook d'effet qui configure un écouteur d'événement personnalisé 'trigger-confetti' sur l'objet window, permettant à d'autres parties de l'application de déclencher l'animation sans passer par les props.
  useEffect(() => {
    const handleTriggerConfetti = () => {
      setIsVisible(true);
      setParticles(generateParticles());
      
      if (soundEnabled) {
        playConfettiSound();
      }
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, duration);
      
      return () => clearTimeout(timer);
    };
    
    window.addEventListener('trigger-confetti', handleTriggerConfetti);
    return () => {
      window.removeEventListener('trigger-confetti', handleTriggerConfetti);
    };
  }, [duration, generateParticles, onComplete, soundEnabled]);
  // === Fin : Écouteur d'événements global pour les confettis ===

  // === Début : Fonction pour jouer le son de célébration ===
  // Explication simple : Cette fonction fait jouer un son joyeux quand les confettis apparaissent, comme quand on entend des applaudissements pendant une fête.
  // Explication technique : Fonction qui crée et joue un élément audio HTML5 avec gestion des erreurs et ajustement du volume, avec fallback silencieux en cas d'échec pour éviter les blocages.
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
  // === Fin : Fonction pour jouer le son de célébration ===

  // === Début : Rendu conditionnel du composant ===
  // Explication simple : Si les confettis ne doivent pas être visibles, on n'affiche rien du tout. Sinon, on dessine tous les petits morceaux de confettis qui tombent du haut de l'écran.
  // Explication technique : Vérification préalable qui retourne null si le composant n'est pas visible, suivie du JSX qui utilise AnimatePresence et motion.div de Framer Motion pour créer l'animation de chute des particules avec des transitions individuelles.
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
  // === Fin : Rendu conditionnel du composant ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre effet de confettis disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres fichiers du projet.
export default ConfettiEffect;
// === Fin : Export du composant ===