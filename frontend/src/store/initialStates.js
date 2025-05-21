// === Ce fichier contient toutes les valeurs de départ pour les différentes parties de l'application === /workspaces/TaskManagerLatestVersion/frontend/src/store/initialStates.js
// Explication simple : Ce fichier est comme une liste de réglages par défaut pour chaque partie de l'application, comme quand tu ouvres un nouveau jeu et que tout commence à zéro.
// Explication technique : Module JavaScript qui définit et exporte les objets d'état initial pour tous les slices Redux, servant de source de vérité pour l'initialisation du store.
// Utilisé dans : Les fichiers de slices Redux pour initialiser leurs états respectifs lors de la création du store.
// Connecté à : Tous les slices Redux (auth, ui, tasks, etc.) et indirectement au store Redux principal.

// frontend/src/store/initialStates.js
// Ce fichier définit les états initiaux pour tous les reducers Redux

// === Début : État initial d'authentification ===
// Explication simple : Cette partie définit comment se présente un utilisateur quand il vient d'arriver dans l'application - il n'est pas encore connecté et a des informations de base.
// Explication technique : Objet qui définit l'état initial pour le slice d'authentification, incluant les propriétés d'authentification, les informations utilisateur et les états de chargement.
export const initialAuthState = {
  isAuthenticated: false,
  token: null,
  user: {
    id: "fake-user-id",
    name: 'Utilisateur',
    email: 'utilisateur@exemple.com',
    profile: {
      avatar: '/default-avatar.png',
      theme: 'default',
      settings: {
        notifications: true,
        language: 'fr',
        soundEffects: true
      }
    },
    gamification: {
      level: 1,
      experience: 0,
      actionPoints: 0,
      badges: []
    }
  },
  loading: false,
  error: null
};
// === Fin : État initial d'authentification ===

// === Début : État initial de l'interface utilisateur ===
// Explication simple : Cette partie définit l'apparence de l'application au démarrage - le thème clair est activé, le menu latéral est ouvert, et il n'y a pas encore de notifications.
// Explication technique : Objet qui définit l'état initial pour le slice UI, avec les préférences visuelles, l'état des composants d'interface et les indicateurs de chargement pour différentes sections.
export const initialUiState = {
  darkMode: false,
  sidebarOpen: true,
  currentTheme: 'default',
  notifications: [],
  modalOpen: false,
  modalContent: {
    type: null,
    data: null
  },
  loading: {
    global: false,
    tasks: false,
    clients: false,
    auth: false,
    gamification: false
  },
  soundEnabled: true
};
// === Fin : État initial de l'interface utilisateur ===

// === Début : État initial de gamification ===
// Explication simple : Cette partie définit comment commence le système de jeu de l'application - tu commences au niveau 1, sans points d'expérience, sans badges et sans activités.
// Explication technique : Objet qui définit l'état initial pour le slice de gamification, incluant les métriques de progression, les récompenses accumulées et l'état des animations de récompense.
export const initialGamificationState = {
  level: 1,
  experience: 0,
  actionPoints: 0,
  totalPointsEarned: 0,
  currentStreak: 0,
  longestStreak: 0,
  badges: [],
  activities: [],
  levels: [],
  loading: false,
  error: null,
  rewardAnimation: {
    show: false,
    type: null,
    data: null
  }
};
// === Fin : État initial de gamification ===

// === Début : État initial des tâches ===
// Explication simple : Cette partie définit comment commence la liste des tâches - elle est vide, sans filtres actifs, et aucune tâche n'est sélectionnée.
// Explication technique : Objet qui définit l'état initial pour le slice des tâches, avec des tableaux vides pour les collections de tâches et des valeurs nulles pour les sélections actuelles.
export const initialTasksState = {
  tasks: [],
  filteredTasks: [],
  currentTask: null,
  filters: {},
  loading: false,
  error: null
};
// === Fin : État initial des tâches ===

// === Début : État initial des clients ===
// Explication simple : Cette partie définit comment commence la liste des clients - elle est vide et aucun client n'est sélectionné pour le moment.
// Explication technique : Objet qui définit l'état initial pour le slice des clients, avec un tableau vide pour la collection de clients et la valeur null pour le client actuellement sélectionné.
export const initialClientsState = {
  clients: [],
  currentClient: null,
  loading: false,
  error: null
};
// === Fin : État initial des clients ===

// === Début : État initial des minuteurs ===
// Explication simple : Cette partie définit comment commencent les chronomètres - aucun n'est en marche, la petite fenêtre de minuteur est cachée et positionnée en bas à droite.
// Explication technique : Objet qui définit l'état initial pour le slice des timers, avec des objets vides pour les collections de minuteurs et des configurations d'UI pour le popup de timer.
export const initialTimerState = {
  runningTimer: null,
  clientTimers: {},
  taskTimers: {},
  currentTimer: null,
  showTimerPopup: false,
  // Utilisation directe de l'un des littéraux autorisés
  timerPopupSize: "medium", // Doit être exactement "small", "medium" ou "large"
  timerPopupPosition: "bottom-right", // Doit être exactement "top-right", "bottom-right" ou "center"
  loading: false,
  error: null
};
// === Fin : État initial des minuteurs ===

// === Début : État initial de l'impact des tâches ===
// Explication simple : Cette partie définit comment commence l'analyse des tâches importantes - aucune tâche importante n'est encore identifiée et aucune analyse n'a été effectuée.
// Explication technique : Objet qui définit l'état initial pour le slice d'impact des tâches, avec un tableau vide pour les tâches à fort impact et des indicateurs d'état pour les analyses.
export const initialTaskImpactState = {
  highImpactTasks: [],
  impactAnalysis: null,
  loading: false,
  applyingAnalysis: false,
  analysisApplied: false,
  error: null
};
// === Fin : État initial de l'impact des tâches ===

// === Début : État initial de la rentabilité ===
// Explication simple : Cette partie définit comment commence le suivi de la rentabilité - aucun client n'a encore de données de rentabilité et aucun résumé global n'existe.
// Explication technique : Objet qui définit l'état initial pour le slice de rentabilité, avec des collections vides pour les données de rentabilité par client et un résumé global initialisé à null.
export const initialProfitabilityState = {
  clientsProfitability: [],
  currentClientProfitability: null,
  globalSummary: null,
  clientTasks: {},
  loading: false,
  error: null
};
// === Fin : État initial de la rentabilité ===

// === Début : État initial des objectifs ===
// Explication simple : Cette partie définit comment commence la gestion des objectifs - aucun objectif n'est encore créé et aucun objectif important n'est identifié.
// Explication technique : Objet qui définit l'état initial pour le slice des objectifs, avec des objets vides pour les collections d'objectifs et la valeur null pour l'objectif actuellement sélectionné.
export const initialObjectivesState = {
  objectives: {},
  highImpactObjectives: {},
  currentObjective: null,
  loading: false,
  error: null
};
// === Fin : État initial des objectifs ===
