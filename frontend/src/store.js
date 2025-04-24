import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import clientsReducer from './slices/clientSlice';
import tasksReducer from './slices/taskSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    clients: clientsReducer,
    tasks: tasksReducer,
  },
});
