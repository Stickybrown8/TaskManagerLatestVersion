// === Ce fichier gère l'apparence et les interactions visuelles de l'application === /workspaces/TaskManagerLatestVersion/frontend/src/store/slices/uiSlice.ts
// Explication simple : Ce fichier est comme le panneau de contrôle qui gère tout ce que tu vois à l'écran - le thème sombre ou clair, les notifications, les fenêtres qui s'ouvrent, et s'assure que tout soit beau et fonctionne bien.
// Explication technique : Module Redux Toolkit qui définit un "slice" pour gérer l'état global de l'interface utilisateur, utilisant l'API createSlice pour encapsuler la logique des paramètres visuels, des notifications, des modales et des états de chargement.
// Utilisé dans : Presque tous les composants qui ont besoin de connaître ou modifier l'état de l'interface utilisateur, comme Header, Sidebar, NotificationCenter, ThemeToggle, LoadingIndicator, ModalManager.
// Connecté à : Store Redux principal, hooks useSelector/useDispatch dans les composants React, potentiellement aux services de notifications, et à tous les composants qui affichent des informations visuelles.

// frontend/src/store/slices/uiSlice.ts
import { createSlice, PayloadAction, createAction } from '@reduxjs/toolkit';

// === Début : Définition des types d'interface utilisateur ===
// Explication simple : Ces lignes décrivent toutes les choses que notre application peut afficher ou cacher - comme une liste de tous les boutons et leviers que tu peux activer sur un tableau de bord.
// Explication technique : Interfaces TypeScript qui définissent la structure complète de l'état UI, incluant les préférences utilisateur, les notifications, l'état des modales et les indicateurs de chargement.
// Types
interface UIState {
  settings: { soundEnabled: boolean; };
  sidebarOpen: boolean;
  darkMode: boolean;
  currentTheme: string;
  notifications: Notification[];
  modalOpen: boolean;
  modalContent: {
    type: 'task' | 'client' | 'profile' | 'badge' | null;
    data: any;
  };
  loading: {
    global: boolean;
    tasks: boolean;
    clients: boolean;
    auth: boolean;
    gamification: boolean;
  };
  soundEnabled: boolean;
}

interface Notification {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp?: number;
  read?: boolean;
  duration?: number; // Ajoutez cette ligne
}
// === Fin : Définition des types d'interface utilisateur ===

// === Début : Configuration de l'état initial ===
// Explication simple : Ces lignes préparent l'état de départ - au début, la barre latérale est ouverte, le thème est choisi selon tes préférences, il n'y a pas de notifications et aucune fenêtre n'est ouverte.
// Explication technique : Objet définissant l'état initial du slice UI avec toutes les propriétés à leurs valeurs par défaut, intégrant une détection système du mode sombre et exporté pour une réutilisation potentielle.
// État initial - Exporté pour être utilisé dans initialStates.js
export const initialUIState: UIState = {
  settings: {
    soundEnabled: true,
  },
  sidebarOpen: true,
  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
  currentTheme: 'default',
  notifications: [],
  modalOpen: false,
  modalContent: {
    type: null,
    data: null,
  },
  loading: {
    global: false,
    tasks: false,
    clients: false,
    auth: false,
    gamification: false,
  },
  soundEnabled: true,
};
// === Fin : Configuration de l'état initial ===

// === Début : Création du slice d'interface utilisateur ===
// Explication simple : Ce gros bloc crée une boîte magique qui contient toutes les actions possibles pour gérer l'apparence de l'application - comme activer le mode nuit, montrer des messages, et ouvrir des fenêtres.
// Explication technique : Utilisation de createSlice de Redux Toolkit pour définir un ensemble de reducers qui modifient l'état de l'UI en réponse à diverses actions, avec une gestion immutable de l'état.
// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUIState,
  reducers: {
    // === Début : Actions pour gérer la barre latérale ===
    // Explication simple : Cette action permet d'ouvrir ou fermer le menu sur le côté, comme quand tu ouvres ou fermes un tiroir.
    // Explication technique : Reducer qui inverse simplement la valeur booléenne de sidebarOpen, permettant aux composants d'afficher ou masquer la barre latérale.
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    // === Fin : Actions pour gérer la barre latérale ===
    
    // === Début : Actions pour gérer le mode sombre ===
    // Explication simple : Cette action active ou désactive les couleurs sombres dans l'application, comme quand tu éteins la lumière pour regarder un film.
    // Explication technique : Reducer qui inverse la valeur de darkMode et applique la classe CSS correspondante à l'élément racine du document pour activer le thème approprié.
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      // Appliquer la classe au document
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    // === Fin : Actions pour gérer le mode sombre ===
    
    // === Début : Actions pour gérer le thème ===
    // Explication simple : Cette action change les couleurs et le style de l'application, comme quand tu changes la couleur de ton cahier ou de ton sac.
    // Explication technique : Reducer simple qui met à jour la valeur currentTheme avec la chaîne fournie, permettant de basculer entre différents thèmes prédéfinis.
    setTheme: (state, action: PayloadAction<string>) => {
      state.currentTheme = action.payload;
    },
    // === Fin : Actions pour gérer le thème ===
    
    // === Début : Actions pour gérer les notifications ===
    // Explication simple : Cette action ajoute un nouveau message dans ta boîte de messages, comme quand quelqu'un te laisse un mot sur ton bureau.
    // Explication technique : Reducer complexe qui crée une nouvelle notification avec des métadonnées générées automatiquement, la place en tête de liste et limite le nombre total de notifications.
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        message: action.payload.message,
        type: action.payload.type,
        timestamp: Date.now(),
        read: false,
        duration: action.payload.duration,
      };
      state.notifications.unshift(newNotification);
      
      // Limiter à 10 notifications
      if (state.notifications.length > 10) {
        state.notifications.pop();
      }
    },
    
    // Explication simple : Cette action marque un message comme lu, comme quand tu fais une coche sur un mot que tu as déjà lu.
    // Explication technique : Reducer qui recherche une notification par son ID et change son état 'read' à true, permettant de filtrer ou d'afficher différemment les notifications lues.
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    
    // Explication simple : Cette action supprime tous tes messages d'un coup, comme quand tu nettoies ton bureau en jetant tous les papiers.
    // Explication technique : Reducer simple qui réinitialise l'array notifications à un tableau vide, effaçant efficacement toutes les notifications actuelles.
    clearNotifications: (state) => {
      state.notifications = [];
    },
    // === Fin : Actions pour gérer les notifications ===
    
    // === Début : Actions pour gérer les fenêtres modales ===
    // Explication simple : Cette action ouvre une fenêtre spéciale sur ton écran, comme quand un message important s'affiche et demande ton attention.
    // Explication technique : Reducer qui active l'état modalOpen et définit le contenu de la modale avec les données fournies, permettant d'afficher différents types de contenu modal.
    openModal: (state, action: PayloadAction<UIState['modalContent']>) => {
      state.modalOpen = true;
      state.modalContent = action.payload;
    },
    
    // Explication simple : Cette action ferme la fenêtre spéciale et la fait disparaître, comme quand tu fermes une boîte de dialogue en cliquant sur "OK".
    // Explication technique : Reducer qui désactive l'état modalOpen et réinitialise le contenu de la modale à null, nettoyant complètement l'état de la modale.
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalContent = {
        type: null,
        data: null,
      };
    },
    // === Fin : Actions pour gérer les fenêtres modales ===
    
    // === Début : Actions pour gérer les indicateurs de chargement ===
    // Explication simple : Cette action active ou désactive les petites roues qui tournent pour montrer que l'application travaille, comme le sablier quand l'ordinateur réfléchit.
    // Explication technique : Reducer qui met à jour un indicateur de chargement spécifique et recalcule l'état de chargement global en vérifiant si au moins un indicateur est actif.
    setLoading: (state, action: PayloadAction<{ key: keyof UIState['loading']; value: boolean }>) => {
      state.loading[action.payload.key] = action.payload.value;
      
      // Mettre à jour le loading global
      const loadingValues = Object.values(state.loading);
      state.loading.global = loadingValues.some(value => value === true);
    },
    // === Fin : Actions pour gérer les indicateurs de chargement ===
    
    // === Début : Actions pour gérer les sons ===
    // Explication simple : Cette action active ou désactive les sons de l'application, comme quand tu mets ton téléphone en mode silencieux.
    // Explication technique : Reducer simple qui inverse la valeur booléenne de soundEnabled, permettant aux composants de savoir s'ils doivent jouer des sons ou non.
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
    // === Fin : Actions pour gérer les sons ===
  },
});
// === Fin : Création du slice d'interface utilisateur ===

// === Début : Exportation des actions ===
// Explication simple : Ces lignes rendent les actions disponibles pour que d'autres parties de l'application puissent les utiliser, comme une liste de commandes que tout le monde peut utiliser.
// Explication technique : Destructuration et exportation des créateurs d'actions générés automatiquement par createSlice, permettant leur utilisation dans les composants via useDispatch.
// Actions
export const {
  toggleSidebar,
  toggleDarkMode,
  setTheme,
  addNotification,
  markNotificationAsRead,
  clearNotifications,
  openModal,
  closeModal,
  setLoading,
  toggleSound,
} = uiSlice.actions;
// === Fin : Exportation des actions ===

// === Début : Exportation du reducer ===
// Explication simple : Cette ligne rend tout le système de gestion de l'interface disponible pour le reste de l'application.
// Explication technique : Exportation par défaut du reducer généré par createSlice, qui sera combiné avec d'autres reducers dans le store Redux principal.
// Reducer
export default uiSlice.reducer;
// === Fin : Exportation du reducer ===
