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

// Plus d'état initial hacké ici : chaque slice gère son propre état initial !

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
});

// Export des types pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
