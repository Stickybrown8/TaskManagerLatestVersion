import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
interface Client {
  _id: string;
  name: string;
  description: string;
  status: 'actif' | 'inactif' | 'archivé';
  contacts: Contact[];
  notes: string;
  tags: string[];
  metrics: {
    tasksCompleted: number;
    tasksInProgress: number;
    tasksPending: number;
    lastActivity: string;
  };
}

interface Contact {
  name: string;
  role: string;
  email: string;
  phone: string;
  isMain: boolean;
}

interface ClientsState {
  clients: Client[];
  currentClient: Client | null;
  loading: boolean;
  error: string | null;
}

// État initial
const initialState: ClientsState = {
  clients: [],
  currentClient: null,
  loading: false,
  error: null,
};

// Slice
const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    fetchClientsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchClientsSuccess: (state, action: PayloadAction<Client[]>) => {
      console.log("→ Reducer fetchClientsSuccess appelé avec :", action.payload); // <-- AJOUT DU LOG
      state.clients = action.payload;
      state.loading = false;
    },
    fetchClientsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchClientStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchClientSuccess: (state, action: PayloadAction<Client>) => {
      state.currentClient = action.payload;
      state.loading = false;
    },
    fetchClientFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    createClientStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    createClientSuccess: (state, action: PayloadAction<Client>) => {
      state.clients.push(action.payload);
      state.loading = false;
    },
    createClientFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateClientStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateClientSuccess: (state, action: PayloadAction<Client>) => {
      const index = state.clients.findIndex(client => client._id === action.payload._id);
      if (index !== -1) {
        state.clients[index] = action.payload;
      }
      if (state.currentClient && state.currentClient._id === action.payload._id) {
        state.currentClient = action.payload;
      }
      state.loading = false;
    },
    updateClientFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteClientStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteClientSuccess: (state, action: PayloadAction<string>) => {
      state.clients = state.clients.filter(client => client._id !== action.payload);
      if (state.currentClient && state.currentClient._id === action.payload) {
        state.currentClient = null;
      }
      state.loading = false;
    },
    deleteClientFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearCurrentClient: (state) => {
      state.currentClient = null;
    },
  },
});

// Actions
export const {
  fetchClientsStart,
  fetchClientsSuccess,
  fetchClientsFailure,
  fetchClientStart,
  fetchClientSuccess,
  fetchClientFailure,
  createClientStart,
  createClientSuccess,
  createClientFailure,
  updateClientStart,
  updateClientSuccess,
  updateClientFailure,
  deleteClientStart,
  deleteClientSuccess,
  deleteClientFailure,
  clearCurrentClient,
} = clientsSlice.actions;

// Reducer
export default clientsSlice.reducer;
