// frontend/src/store/slices/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: number;
  read: boolean;
}

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

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUIState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      // Appliquer la classe au document
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setTheme: (state, action: PayloadAction<string>) => {
      state.currentTheme = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        message: action.payload.message,
        type: action.payload.type,
        timestamp: Date.now(),
        read: false,
      };
      state.notifications.unshift(newNotification);
      
      // Limiter à 10 notifications
      if (state.notifications.length > 10) {
        state.notifications.pop();
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    openModal: (state, action: PayloadAction<UIState['modalContent']>) => {
      state.modalOpen = true;
      state.modalContent = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalContent = {
        type: null,
        data: null,
      };
    },
    setLoading: (state, action: PayloadAction<{ key: keyof UIState['loading']; value: boolean }>) => {
      state.loading[action.payload.key] = action.payload.value;
      
      // Mettre à jour le loading global
      const loadingValues = Object.values(state.loading);
      state.loading.global = loadingValues.some(value => value === true);
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
  },
});

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

// Reducer
export default uiSlice.reducer;
