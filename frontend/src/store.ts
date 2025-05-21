import { configureStore } from '@reduxjs/toolkit';
// useDispatch and useSelector hooks are used in components, not typically in store setup directly for RootState/AppDispatch.
// TypedUseSelectorHook is used in hooks.ts.
// For store.ts, we primarily need types for store configuration.
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import tasksReducer from './slices/tasksSlice';
import clientsReducer from './slices/clientsSlice';
import gamificationReducer from './slices/gamificationSlice';
import timerReducer from './slices/timerSlice';
import taskImpactReducer from './slices/taskImpactSlice';
import profitabilityReducer from './slices/profitabilitySlice';
import objectivesReducer from './slices/objectivesSlice';

// Importations nécessaires pour le typage du middleware
import { Middleware, MiddlewareAPI, Dispatch, AnyAction } from '@reduxjs/toolkit';

// Ajout des types explicites au middleware
const timerActionMiddleware: Middleware = 
  (store: MiddlewareAPI) => 
  (next: Dispatch) => 
  (action: AnyAction) => {
    // Check if the action type is related to the timer slice and if it's a an action object
    if (typeof action === 'object' && action !== null && 'type' in action && typeof action.type === 'string' && action.type.startsWith('timer/')) {
      console.log('⚡ Action timer détectée:', action);
      // Ensure getState().timer exists and is the correct slice state
      const timerStateBefore = store.getState().timer; 
      if (timerStateBefore) {
        console.log('📊 État timer avant:', timerStateBefore);
      }
      const result = next(action);
      const timerStateAfter = store.getState().timer;
      if (timerStateAfter) {
        console.log('📊 État timer après:', timerStateAfter);
      }
      return result;
    }
    return next(action);
  };

// Définir le store Redux
export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    tasks: tasksReducer,
    clients: clientsReducer,
    gamification: gamificationReducer,
    timer: timerReducer,
    taskImpact: taskImpactReducer,
    profitability: profitabilityReducer,
    objectives: objectivesReducer
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(timerActionMiddleware)
});

// Après la définition du store, ajoutez:
// Force une réinitialisation du store pour s'assurer que tous les slices sont correctement instanciés
export function resetStore() {
  // It's generally better to dispatch specific reset actions for each slice 
  // or use a meta-reducer if a full reset is needed.
  // A generic 'RESET_STORE' action might not be handled by individual slices unless they are designed to.
  // For now, keeping the existing logic but noting this as a potential area for improvement.
  store.dispatch({ type: 'RESET_STORE_ACTION_FROM_STORE_TS' }); // Renamed action type for clarity
  console.log("Store réinitialisé (depuis store.ts)", store.getState());
}

// Export des types pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// The following state interfaces (AuthState, GamificationState, UIState) are examples
// and might be redundant if the actual slice files (e.g., authSlice.ts) export their own
// more accurate state types. It's generally better to rely on types exported from slices.
// For the purpose of this conversion, I'm keeping them as they were in the original index.ts,
// but they should be reviewed for accuracy and necessity.

// Définir des types explicites pour les états des slices (Exemples - vérifier si redondant avec les types des slices)
export interface AuthStateExample { // Renamed to avoid conflict if AuthState is imported from authSlice
  user?: {
    name?: string;
    email?: string;
    profile?: {
      avatar?: string;
    };
  } | null;
  isAuthenticated?: boolean;
  token?: string | null;
  loading?: boolean;
  error?: string | null;
}

export interface GamificationStateExample { // Renamed
  level?: number;
  experience?: number;
  actionPoints?: number;
  badges?: any[];
}

export interface UIStateExample { // Renamed
  darkMode?: boolean;
  sidebarOpen?: boolean;
}
