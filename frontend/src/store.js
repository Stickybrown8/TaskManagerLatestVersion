import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService, clientsService, tasksService } from './api';

// Thunk pour la connexion
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const user = await authService.login(email, password);
      return user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de connexion');
    }
  }
);

// Thunk pour vérifier l'authentification
export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authService.checkAuth();
      return user;
    } catch (error) {
      return rejectWithValue('Session expirée');
    }
  }
);

// Slice d'authentification
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null
  },
  reducers: {
    logout: (state) => {
      authService.logout();
      state.isAuthenticated = false;
      state.user = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload;
        }
      });
  }
});

// Thunk pour récupérer les clients
export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async (_, { rejectWithValue }) => {
    try {
      const clients = await clientsService.getClients();
      return clients;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des clients');
    }
  }
);

// Slice des clients
const clientsSlice = createSlice({
  name: 'clients',
  initialState: {
    clients: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Thunk pour récupérer les tâches
export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async (_, { rejectWithValue }) => {
    try {
      const tasks = await tasksService.getTasks();
      return tasks;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la récupération des tâches');
    }
  }
);

// Slice des tâches
const tasksSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export des actions
export const { logout } = authSlice.actions;

// Store Redux avec les reducers
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    clients: clientsSlice.reducer,
    tasks: tasksSlice.reducer
  },
});
