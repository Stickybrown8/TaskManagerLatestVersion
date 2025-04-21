// frontend/src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import tasksReducer from './slices/tasksSlice';
import clientsReducer from './slices/clientsSlice';
import gamificationReducer from './slices/gamificationSlice';
import timerReducer from './slices/timerSlice';
import taskImpactReducer from './slices/taskImpactSlice';
import profitabilityReducer from './slices/profitabilitySlice';
import objectivesReducer from './slices/objectivesSlice';

import { 
  initialAuthState, 
  initialUiState,
  initialGamificationState,
  initialTasksState,
  initialClientsState,
  initialTimerState,
  initialTaskImpactState,
  initialProfitabilityState,
  initialObjectivesState
} from './initialStates';

// Configuration du store Redux
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
  // S'assurer que les états initiaux sont correctement définis
  preloadedState: {
    auth: initialAuthState,
    ui: initialUiState,
    gamification: initialGamificationState,
    tasks: initialTasksState,
    clients: initialClientsState,
    timer: initialTimerState,
    taskImpact: initialTaskImpactState,
    profitability: initialProfitabilityState,
    objectives: initialObjectivesState
  }
});

// Export des types pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks typés
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
