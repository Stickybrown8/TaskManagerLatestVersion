import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import clientsReducer from './slices/clientsSlice';
import tasksReducer from './slices/tasksSlice';
import gamificationReducer from './slices/gamificationSlice';
import uiReducer from './slices/uiSlice';
import timerReducer from './slices/timerSlice';
import taskImpactReducer from './slices/taskImpactSlice';
import profitabilityReducer from './slices/profitabilitySlice';
import objectivesReducer from './slices/objectivesSlice';
import { useAppDispatch, useAppSelector } from '../hooks';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientsReducer,
    tasks: tasksReducer,
    gamification: gamificationReducer,
    ui: uiReducer,
    timer: timerReducer,
    taskImpact: taskImpactReducer,
    profitability: profitabilityReducer,
    objectives: objectivesReducer
  },
});

// Export the custom hooks
export { useAppDispatch, useAppSelector };

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export * from './slices/authSlice';
export * from './slices/clientsSlice';
export * from './slices/tasksSlice';
export * from './slices/gamificationSlice';
export * from './slices/uiSlice';