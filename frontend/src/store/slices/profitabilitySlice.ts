// === Ce fichier gère tout ce qui concerne la rentabilité financière des clients === /workspaces/TaskManagerLatestVersion/frontend/src/store/slices/profitabilitySlice.ts
// Explication simple : Ce fichier est comme une calculatrice qui garde en mémoire combien d'argent tu gagnes avec chaque client, combien d'heures tu as travaillé pour eux, et si c'est rentable ou pas.
// Explication technique : Module Redux Toolkit qui définit un "slice" pour gérer l'état de rentabilité des clients, utilisant l'API createSlice et createAsyncThunk pour encapsuler la logique de réduction et les appels asynchrones à l'API.
// Utilisé dans : Les composants qui affichent ou modifient des données de rentabilité comme ClientProfitabilityDashboard, ProfitabilityForm, ProfitabilitySummary, et les tableaux de bord financiers.
// Connecté à : Store Redux principal, service de rentabilité (profitabilityService) via les API, et composants React qui utilisent les données de rentabilité via useSelector/useDispatch.

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { profitabilityService } from '../../services/profitabilityService';

// === Début : Définition des types de paramètres ===
// Explication simple : Ces lignes décrivent les informations dont on a besoin quand on veut modifier le prix de l'heure, le temps passé, ou le temps prévu pour un client.
// Explication technique : Interfaces TypeScript qui définissent les structures de données pour les paramètres des fonctions thunk, assurant la sécurité des types lors des appels.
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
// === Fin : Définition des types de paramètres ===

// === Début : Définition des thunks pour les opérations API ===
// Explication simple : Ces fonctions sont comme des assistants spéciaux qui vont parler à la base de données pour chercher ou modifier les informations de rentabilité des clients.
// Explication technique : Collection de thunks asynchrones créés avec createAsyncThunk qui encapsulent les appels à l'API de rentabilité, avec gestion des erreurs et retour de données formatées.
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
// === Fin : Définition des thunks pour les opérations API ===

// === Début : Définition des types pour l'état de rentabilité ===
// Explication simple : Ces lignes décrivent toutes les informations de rentabilité qu'on garde en mémoire - comme une fiche détaillée pour chaque client et un résumé général.
// Explication technique : Interfaces TypeScript qui définissent la structure complète de l'état de rentabilité, incluant les données par client, le résumé global et les métriques associées.
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
// === Fin : Définition des types pour l'état de rentabilité ===

// === Début : Configuration de l'état initial ===
// Explication simple : Ces lignes préparent l'état de départ - au début, on n'a pas de données de rentabilité, pas de client sélectionné, et pas de résumé global.
// Explication technique : Objet définissant l'état initial du slice de rentabilité avec toutes les propriétés à leurs valeurs par défaut, utilisé lors de l'initialisation du store Redux.
// État initial
const initialState: ProfitabilityState = {
  clientsProfitability: [],
  currentClientProfitability: null,
  globalSummary: null,
  clientTasks: {},
  loading: false,
  error: null
};
// === Fin : Configuration de l'état initial ===

// === Début : Création du slice de rentabilité ===
// Explication simple : Ce bloc crée une grande boîte magique qui contient toutes les actions possibles pour gérer les informations de rentabilité - les récupérer, les modifier, etc.
// Explication technique : Utilisation de createSlice de Redux Toolkit pour définir les reducers standards et extraReducers qui gèrent l'état de rentabilité en réponse à diverses actions.
// Slice
const profitabilitySlice = createSlice({
  name: 'profitability',
  initialState,
  reducers: {
    // === Début : Actions pour gérer les erreurs et le client courant ===
    // Explication simple : Ces actions permettent d'effacer les messages d'erreur et de choisir ou effacer le client qu'on regarde en détail.
    // Explication technique : Ensemble de reducers qui gèrent l'état d'erreur et la sélection/désélection du client actif dans l'interface utilisateur.
    clearProfitabilityError: (state) => {
      state.error = null;
    },
    setCurrentClientProfitability: (state, action: PayloadAction<ClientProfitability>) => {
      state.currentClientProfitability = action.payload;
    },
    clearCurrentClientProfitability: (state) => {
      state.currentClientProfitability = null;
    }
    // === Fin : Actions pour gérer les erreurs et le client courant ===
  },
  extraReducers: (builder) => {
    builder
      // === Début : Reducers pour récupérer toutes les données de rentabilité ===
      // Explication simple : Ces actions gèrent quand tu demandes à voir la rentabilité de tous tes clients - elles disent "je cherche", puis "voici les données" ou "je n'ai pas pu les trouver".
      // Explication technique : Groupe de reducers qui gèrent le cycle de vie (pending, fulfilled, rejected) de la requête asynchrone fetchAllProfitability.
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
      // === Fin : Reducers pour récupérer toutes les données de rentabilité ===

      // === Début : Reducers pour récupérer la rentabilité d'un client spécifique ===
      // Explication simple : Ces actions gèrent quand tu demandes à voir la rentabilité d'un seul client - comme quand tu veux connaître les détails d'un client précis.
      // Explication technique : Ensemble de reducers qui contrôlent le flux d'une requête pour la rentabilité d'un client unique identifié par son ID.
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
      // === Fin : Reducers pour récupérer la rentabilité d'un client spécifique ===

      // === Début : Reducers pour mettre à jour le taux horaire d'un client ===
      // Explication simple : Ces actions gèrent quand tu changes le prix de l'heure pour un client - comme quand tu décides de facturer plus ou moins cher.
      // Explication technique : Groupe de reducers qui gèrent le cycle complet d'une mise à jour du taux horaire, avec cohérence dans toutes les parties de l'état.
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
      // === Fin : Reducers pour mettre à jour le taux horaire d'un client ===

      // === Début : Reducers pour mettre à jour les heures passées pour un client ===
      // Explication simple : Ces actions gèrent quand tu enregistres le temps que tu as passé à travailler pour un client - comme quand tu notes les heures dans ton agenda.
      // Explication technique : Ensemble de reducers qui gèrent la mise à jour des heures passées pour un client, en maintenant la cohérence des données à travers l'état.
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
      // === Fin : Reducers pour mettre à jour les heures passées pour un client ===

      // === Début : Reducers pour mettre à jour les heures cibles pour un client ===
      // Explication simple : Ces actions gèrent quand tu changes le nombre d'heures que tu prévois de travailler pour un client - comme quand tu planifies ton temps à l'avance.
      // Explication technique : Groupe de reducers qui contrôlent la mise à jour des heures cibles pour un client, assurant la propagation des changements dans tout l'état.
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
      // === Fin : Reducers pour mettre à jour les heures cibles pour un client ===

      // === Début : Reducers pour récupérer le résumé global de rentabilité ===
      // Explication simple : Ces actions gèrent quand tu demandes à voir un résumé général de la rentabilité de tous tes clients - comme une vue d'ensemble de tes finances.
      // Explication technique : Ensemble de reducers qui gèrent la récupération d'un résumé consolidé des métriques de rentabilité pour l'ensemble des clients.
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
      // === Fin : Reducers pour récupérer le résumé global de rentabilité ===

      // === Début : Reducers pour récupérer les tâches d'un client ===
      // Explication simple : Ces actions gèrent quand tu demandes à voir toutes les tâches que tu as faites pour un client - pour comprendre sur quoi tu as passé du temps.
      // Explication technique : Groupe de reducers qui gèrent la récupération des tâches associées à un client, les stockant dans une structure indexée par ID client.
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
      // === Fin : Reducers pour récupérer les tâches d'un client ===
  }
});
// === Fin : Création du slice de rentabilité ===

// === Début : Exportation des actions et du reducer ===
// Explication simple : Ces lignes rendent les actions disponibles pour le reste de l'application et le système de gestion de rentabilité complet.
// Explication technique : Destructuration et exportation des créateurs d'actions générés par createSlice et du reducer complet, permettant leur utilisation dans les composants et le store Redux.
export const { clearProfitabilityError, setCurrentClientProfitability, clearCurrentClientProfitability } = profitabilitySlice.actions;

export default profitabilitySlice.reducer;
// === Fin : Exportation des actions et du reducer ===
