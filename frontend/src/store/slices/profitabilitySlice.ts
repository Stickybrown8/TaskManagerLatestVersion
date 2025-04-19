import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { profitabilityService } from '../../services/api';

// Définition des interfaces pour les types
interface UpdateHourlyRateParams {
  clientId: string;
  hourlyRate: number;
}

interface UpdateSpentHoursParams {
  clientId: string;
  spentHours: number;
  incrementOnly: boolean;
}

interface UpdateTargetHoursParams {
  clientId: string;
  targetHours: number;
}

// Thunks
export const fetchAllProfitability = createAsyncThunk(
  'profitability/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await profitabilityService.getAllProfitability();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Erreur lors de la récupération des données de rentabilité');
    }
  }
);

export const fetchClientProfitability = createAsyncThunk(
  'profitability/fetchClient',
  async (clientId: string, { rejectWithValue }) => {
    try {
      const data = await profitabilityService.getClientProfitability(clientId);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Erreur lors de la récupération des données de rentabilité du client');
    }
  }
);

export const updateClientHourlyRate = createAsyncThunk(
  'profitability/updateHourlyRate',
  async (params: UpdateHourlyRateParams, { rejectWithValue }) => {
    try {
      const data = await profitabilityService.updateHourlyRate(params.clientId, params.hourlyRate);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Erreur lors de la mise à jour du taux horaire');
    }
  }
);

export const updateClientSpentHours = createAsyncThunk(
  'profitability/updateSpentHours',
  async (params: UpdateSpentHoursParams, { rejectWithValue }) => {
    try {
      const data = await profitabilityService.updateSpentHours(params.clientId, params.spentHours, params.incrementOnly);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Erreur lors de la mise à jour des heures passées');
    }
  }
);

export const updateClientTargetHours = createAsyncThunk(
  'profitability/updateTargetHours',
  async (params: UpdateTargetHoursParams, { rejectWithValue }) => {
    try {
      const data = await profitabilityService.updateTargetHours(params.clientId, params.targetHours);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Erreur lors de la mise à jour des heures cibles');
    }
  }
);

export const fetchGlobalProfitabilitySummary = createAsyncThunk(
  'profitability/fetchGlobalSummary',
  async (_, { rejectWithValue }) => {
    try {
      const data = await profitabilityService.getGlobalProfitabilitySummary();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Erreur lors de la récupération du résumé global');
    }
  }
);

export const fetchClientTasks = createAsyncThunk(
  'profitability/fetchClientTasks',
  async (clientId: string, { rejectWithValue }) => {
    try {
      const data = await profitabilityService.getClientTasks(clientId);
      return { clientId, data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Erreur lors de la récupération des tâches du client');
    }
  }
);

// Définition des interfaces pour l'état
interface ClientProfitability {
  _id: string;
  clientId: {
    _id: string;
    name: string;
  };
  hourlyRate: number;
  spentHours: number;
  targetHours: number;
  remainingHours: number;
  isProfitable: boolean;
  profitabilityPercentage: number;
}

interface GlobalSummary {
  totalClients: number;
  profitableClients: number;
  unprofitableClients: number;
  totalHoursSpent: number;
  totalHoursTarget: number;
  totalRemainingHours: number;
  averageHourlyRate: number;
  averageProfitability: number;
}

interface ProfitabilityState {
  clientsProfitability: ClientProfitability[];
  currentClientProfitability: ClientProfitability | null;
  globalSummary: GlobalSummary | null;
  clientTasks: Record<string, any[]>;
  loading: boolean;
  error: string | null;
}

// État initial
const initialState: ProfitabilityState = {
  clientsProfitability: [],
  currentClientProfitability: null,
  globalSummary: null,
  clientTasks: {},
  loading: false,
  error: null
};

// Slice
const profitabilitySlice = createSlice({
  name: 'profitability',
  initialState,
  reducers: {
    clearProfitabilityError: (state) => {
      state.error = null;
    },
    setCurrentClientProfitability: (state, action: PayloadAction<ClientProfitability>) => {
      state.currentClientProfitability = action.payload;
    },
    clearCurrentClientProfitability: (state) => {
      state.currentClientProfitability = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchAllProfitability
      .addCase(fetchAllProfitability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProfitability.fulfilled, (state, action: PayloadAction<ClientProfitability[]>) => {
        state.loading = false;
        state.clientsProfitability = action.payload;
      })
      .addCase(fetchAllProfitability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Une erreur est survenue';
      })

      // fetchClientProfitability
      .addCase(fetchClientProfitability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientProfitability.fulfilled, (state, action: PayloadAction<ClientProfitability>) => {
        state.loading = false;
        state.currentClientProfitability = action.payload;

        // Mettre à jour également dans la liste complète si elle existe
        const index = state.clientsProfitability.findIndex(p => p.clientId._id === action.payload.clientId._id);
        if (index !== -1) {
          state.clientsProfitability[index] = action.payload;
        } else {
          state.clientsProfitability.push(action.payload);
        }
      })
      .addCase(fetchClientProfitability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Une erreur est survenue';
      })

      // updateClientHourlyRate
      .addCase(updateClientHourlyRate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClientHourlyRate.fulfilled, (state, action: PayloadAction<ClientProfitability>) => {
        state.loading = false;

        // Mettre à jour dans la liste complète
        const index = state.clientsProfitability.findIndex(p => p.clientId._id === action.payload.clientId._id);
        if (index !== -1) {
          state.clientsProfitability[index] = action.payload;
        } else {
          state.clientsProfitability.push(action.payload);
        }

        // Mettre à jour le client courant si nécessaire
        if (state.currentClientProfitability && state.currentClientProfitability.clientId._id === action.payload.clientId._id) {
          state.currentClientProfitability = action.payload;
        }
      })
      .addCase(updateClientHourlyRate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Une erreur est survenue';
      })

      // updateClientSpentHours
      .addCase(updateClientSpentHours.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClientSpentHours.fulfilled, (state, action: PayloadAction<ClientProfitability>) => {
        state.loading = false;

        // Mettre à jour dans la liste complète
        const index = state.clientsProfitability.findIndex(p => p.clientId._id === action.payload.clientId._id);
        if (index !== -1) {
          state.clientsProfitability[index] = action.payload;
        } else {
          state.clientsProfitability.push(action.payload);
        }

        // Mettre à jour le client courant si nécessaire
        if (state.currentClientProfitability && state.currentClientProfitability.clientId._id === action.payload.clientId._id) {
          state.currentClientProfitability = action.payload;
        }
      })
      .addCase(updateClientSpentHours.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Une erreur est survenue';
      })

      // updateClientTargetHours
      .addCase(updateClientTargetHours.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateClientTargetHours.fulfilled, (state, action: PayloadAction<ClientProfitability>) => {
        state.loading = false;

        // Mettre à jour dans la liste complète
        const index = state.clientsProfitability.findIndex(p => p.clientId._id === action.payload.clientId._id);
        if (index !== -1) {
          state.clientsProfitability[index] = action.payload;
        } else {
          state.clientsProfitability.push(action.payload);
        }

        // Mettre à jour le client courant si nécessaire
        if (state.currentClientProfitability && state.currentClientProfitability.clientId._id === action.payload.clientId._id) {
          state.currentClientProfitability = action.payload;
        }
      })
      .addCase(updateClientTargetHours.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Une erreur est survenue';
      })

      // fetchGlobalProfitabilitySummary
      .addCase(fetchGlobalProfitabilitySummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGlobalProfitabilitySummary.fulfilled, (state, action: PayloadAction<GlobalSummary>) => {
        state.loading = false;
        state.globalSummary = action.payload;
      })
      .addCase(fetchGlobalProfitabilitySummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Une erreur est survenue';
      })

      // fetchClientTasks
      .addCase(fetchClientTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.clientTasks[action.payload.clientId] = action.payload.data;
      })
      .addCase(fetchClientTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Une erreur est survenue';
      });
  }
});

export const { clearProfitabilityError, setCurrentClientProfitability, clearCurrentClientProfitability } = profitabilitySlice.actions;

export default profitabilitySlice.reducer;
