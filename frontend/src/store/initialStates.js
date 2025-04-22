// frontend/src/store/initialStates.js
// Ce fichier définit les états initiaux pour tous les reducers Redux

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

export const initialTasksState = {
  tasks: [],
  filteredTasks: [],
  currentTask: null,     // Propriété manquante ajoutée
  filters: {},
  loading: false,
  error: null
};

export const initialClientsState = {
  clients: [],
  loading: false,
  error: null
};

export const initialTimerState = {
  runningTimer: null,
  timers: [],
  showTimerPopup: false,
  timerPopupSize: 'medium',
  timerPopupPosition: 'bottom-right',
  loading: false,
  error: null
};

export const initialTaskImpactState = {
  highImpactTasks: [],
  impactAnalysis: null,
  loading: false,
  applyingAnalysis: false,
  analysisApplied: false,
  error: null
};

export const initialProfitabilityState = {
  clientsProfitability: [],
  globalSummary: null,
  loading: false,
  error: null
};

export const initialObjectivesState = {
  objectives: [],
  loading: false,
  error: null
};
