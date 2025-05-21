// === Ce fichier personnalise l'apparence visuelle de toute l'application en définissant des couleurs et animations === /workspaces/TaskManagerLatestVersion/frontend/tailwind.config.js
// Explication simple : Ce fichier est comme une boîte de peinture spéciale pour l'application - il définit toutes les couleurs que l'application peut utiliser, les types de lettres et les animations que les éléments peuvent faire.
// Explication technique : Fichier de configuration Tailwind CSS qui définit l'ensemble des personnalisations du framework, incluant les palettes de couleurs, typographies et animations utilisées à travers l'application.
// Utilisé dans : Processus de build qui génère les classes CSS finales utilisées par l'application, en association avec les directives @tailwind dans index.css.
// Connecté à : Fichier index.css qui importe Tailwind, postcss.config.js qui configure le traitement CSS, et indirectement à tous les composants React qui utilisent des classes Tailwind.

/** @type {import('tailwindcss').Config} */

// === Début : Configuration principale de Tailwind ===
// Explication simple : Cette partie est comme la recette principale qui dit comment préparer tous les styles pour l'application - elle dit à l'ordinateur quels fichiers regarder et quelles couleurs spéciales utiliser.
// Explication technique : Objet de configuration principal exporté qui définit les chemins des fichiers à analyser, et étend le thème par défaut de Tailwind avec des personnalisations spécifiques à l'application.
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // === Début : Définition des palettes de couleurs personnalisées ===
      // Explication simple : Cette partie définit toutes les différentes nuances de couleurs que l'application peut utiliser - comme des bleus pour les choses importantes (primary), des violets pour les détails (secondary), des verts pour les messages positifs, des oranges pour les avertissements et des rouges pour les erreurs.
      // Explication technique : Extension de l'objet theme.colors qui ajoute des palettes de couleurs sémantiques complètes avec des nuances graduées de 50 à 900, suivant les conventions de nommage Tailwind pour les systèmes de design cohérents.
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      // === Fin : Définition des palettes de couleurs personnalisées ===
      
      // === Début : Configuration de la typographie ===
      // Explication simple : Cette partie dit quel type d'écriture l'application va utiliser, comme choisir une police spéciale "Inter" pour que tous les textes aient la même apparence.
      // Explication technique : Extension des familles de polices par défaut pour définir 'Inter' comme police principale sans-serif, assurant une cohérence typographique dans toute l'application.
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      // === Fin : Configuration de la typographie ===
      
      // === Début : Définition des animations personnalisées ===
      // Explication simple : Cette partie crée des animations spéciales et plus lentes que les normales - comme faire rebondir un élément doucement, le faire pulser lentement ou le faire tourner tranquillement.
      // Explication technique : Extension des animations par défaut de Tailwind avec des variantes plus lentes des animations standards, définissant des durées et courbes d'accélération personnalisées pour des effets visuels plus subtils.
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      // === Fin : Définition des animations personnalisées ===
    },
  },
  // === Début : Configuration des plugins ===
  // Explication simple : Cette partie est prête à accueillir des outils supplémentaires qui pourraient ajouter des fonctionnalités spéciales aux styles, mais pour l'instant la boîte à outils est vide.
  // Explication technique : Array de plugins Tailwind qui peut être utilisé pour étendre les fonctionnalités de base du framework avec des utilitaires ou composants additionnels, actuellement vide dans cette configuration.
  plugins: [],
  // === Fin : Configuration des plugins ===
}
// === Fin : Configuration principale de Tailwind ===
