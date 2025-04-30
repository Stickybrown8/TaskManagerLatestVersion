// frontend/src/store/slices/authSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/User'; // On utilise le type global User

// Types
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  rehydrated: boolean;
}

interface LoginPayload {
  user: User;
  token: string;
}

// État initial
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
  rehydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<LoginPayload>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
      state.rehydrated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = action.payload;
      state.rehydrated = true;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.rehydrated = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    updateUserGamification: (state, action: PayloadAction<Partial<User['gamification']>>) => {
      if (state.user && state.user.gamification) {
        state.user.gamification = { ...state.user.gamification, ...action.payload };
      }
    },
    setRehydrated: (state) => {
      state.rehydrated = true;
    }
  },
});

// Actions
export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUserProfile,
  updateUserGamification,
  setRehydrated,
} = authSlice.actions;

// Reducer
export default authSlice.reducer;