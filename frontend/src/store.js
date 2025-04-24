import { configureStore } from '@reduxjs/toolkit';
import authReducer from './store/slices/authSlice';
import clientsReducer from './store/slices/clientsSlice';
import tasksReducer from './store/slices/tasksSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientsReducer,
    tasks: tasksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
