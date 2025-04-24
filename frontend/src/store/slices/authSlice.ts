import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  profile?: {
    avatar: string;
    theme: string;
    settings: {
      notifications: boolean;
      language: string;
      soundEffects: boolean;
    };
  };
  gamification?: {
    level: number;
    experience: number;
    actionPoints: number;
    badges: any[];
  };
}

interface LoginPayload {
  user: User;
  token: string;
}

// État initial propre (aucune donnée factice)
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
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
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
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
} = authSlice.actions;

// Reducer
export default authSlice.reducer;
