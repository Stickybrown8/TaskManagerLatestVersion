import { createSlice, PayloadAction, SliceCaseReducers, CaseReducer } from '@reduxjs/toolkit';
import { Dispatch } from 'redux';

// Définition des interfaces pour les types
interface Objective {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  priority: string;
  progress: number;
  isHighImpact: boolean;
  taskIds?: string[];
}

interface ObjectivesState {
  objectives: Record<string, Objective>;
  highImpactObjectives: Record<string, Objective>;
  currentObjective: Objective | null;
  loading: boolean;
  error: string | null;
}

// État initial
const initialState: ObjectivesState = {
  objectives: {},
  highImpactObjectives: {},
  currentObjective: null,
  loading: false,
  error: null
};

// Création du slice avec des types explicites
const objectivesSlice = createSlice<
  ObjectivesState,
  {
    // Définition explicite des reducers
    setCurrentObjective: CaseReducer<ObjectivesState, PayloadAction<Objective | null>>;
    clearCurrentObjective: CaseReducer<ObjectivesState>;
    clearObjectivesError: CaseReducer<ObjectivesState>;
    addObjective: CaseReducer<ObjectivesState, PayloadAction<Objective>>;
    updateObjective: CaseReducer<ObjectivesState, PayloadAction<Objective>>;
    deleteObjective: CaseReducer<ObjectivesState, PayloadAction<string>>;
    updateObjectiveProgress: CaseReducer<ObjectivesState, PayloadAction<{ objectiveId: string; progress: number }>>;
    setHighImpactObjective: CaseReducer<ObjectivesState, PayloadAction<string>>;
    // Reducers pour les opérations asynchrones
    'fetchObjectives/pending': CaseReducer<ObjectivesState>;
    'fetchObjectives/fulfilled': CaseReducer<ObjectivesState, PayloadAction<Record<string, Objective>>>;
    'fetchObjectives/rejected': CaseReducer<ObjectivesState, PayloadAction<string>>;
    'fetchHighImpactObjectives/pending': CaseReducer<ObjectivesState>;
    'fetchHighImpactObjectives/fulfilled': CaseReducer<ObjectivesState, PayloadAction<Record<string, Objective>>>;
    'fetchHighImpactObjectives/rejected': CaseReducer<ObjectivesState, PayloadAction<string>>;
  },
  'objectives'
>({
  name: 'objectives',
  initialState,
  reducers: {
    // Définir l'objectif courant
    setCurrentObjective: (state, action: PayloadAction<Objective | null>) => {
      state.currentObjective = action.payload;
    },

    // Effacer l'objectif courant
    clearCurrentObjective: (state) => {
      state.currentObjective = null;
    },

    // Gérer les erreurs
    clearObjectivesError: (state) => {
      state.error = null;
    },

    // Ajouter un objectif
    addObjective: (state, action: PayloadAction<Objective>) => {
      const objective = action.payload;
      state.objectives[objective._id] = objective;

      if (objective.isHighImpact) {
        state.highImpactObjectives[objective._id] = objective;
      }
    },

    // Mettre à jour un objectif
    updateObjective: (state, action: PayloadAction<Objective>) => {
      const objective = action.payload;

      if (state.objectives[objective._id]) {
        state.objectives[objective._id] = objective;

        // Mettre à jour ou supprimer de highImpactObjectives selon isHighImpact
        if (objective.isHighImpact) {
          state.highImpactObjectives[objective._id] = objective;
        } else if (state.highImpactObjectives[objective._id]) {
          delete state.highImpactObjectives[objective._id];
        }

        // Mettre à jour l'objectif courant si nécessaire
        if (state.currentObjective && state.currentObjective._id === objective._id) {
          state.currentObjective = objective;
        }
      }
    },

    // Supprimer un objectif
    deleteObjective: (state, action: PayloadAction<string>) => {
      const objectiveId = action.payload;

      if (state.objectives[objectiveId]) {
        delete state.objectives[objectiveId];

        if (state.highImpactObjectives[objectiveId]) {
          delete state.highImpactObjectives[objectiveId];
        }

        if (state.currentObjective && state.currentObjective._id === objectiveId) {
          state.currentObjective = null;
        }
      }
    },

    // Mettre à jour le progrès d'un objectif
    updateObjectiveProgress: (state, action: PayloadAction<{ objectiveId: string; progress: number }>) => {
      const { objectiveId, progress } = action.payload;

      if (state.objectives[objectiveId]) {
        state.objectives[objectiveId].progress = progress;

        if (state.highImpactObjectives[objectiveId]) {
          state.highImpactObjectives[objectiveId].progress = progress;
        }

        if (state.currentObjective && state.currentObjective._id === objectiveId) {
          state.currentObjective.progress = progress;
        }
      }
    },

    // Définir un objectif comme étant à fort impact
    setHighImpactObjective: (state, action: PayloadAction<string>) => {
      const objectiveId = action.payload;

      if (state.objectives[objectiveId]) {
        state.objectives[objectiveId].isHighImpact = true;
        state.highImpactObjectives[objectiveId] = state.objectives[objectiveId];
      }
    },

    // Reducers pour les opérations asynchrones
    'fetchObjectives/pending': (state) => {
      state.loading = true;
      state.error = null;
    },
    'fetchObjectives/fulfilled': (state, action: PayloadAction<Record<string, Objective>>) => {
      state.loading = false;
      state.objectives = action.payload;
    },
    'fetchObjectives/rejected': (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    'fetchHighImpactObjectives/pending': (state) => {
      state.loading = true;
      state.error = null;
    },
    'fetchHighImpactObjectives/fulfilled': (state, action: PayloadAction<Record<string, Objective>>) => {
      state.loading = false;
      state.highImpactObjectives = action.payload;
    },
    'fetchHighImpactObjectives/rejected': (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

// Export des actions
export const {
  setCurrentObjective,
  clearCurrentObjective,
  clearObjectivesError,
  addObjective,
  updateObjective,
  deleteObjective,
  updateObjectiveProgress,
  setHighImpactObjective
} = objectivesSlice.actions;

// Export du reducer
export default objectivesSlice.reducer;

// Thunks pour les opérations asynchrones
export const fetchObjectivesAsync = () => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'objectives/fetchObjectives/pending' });
    // Remplacez cette ligne par votre appel API réel
    const objectives = {} as Record<string, Objective>; // Temporaire, à remplacer par votre appel API
    dispatch({ type: 'objectives/fetchObjectives/fulfilled', payload: objectives });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    dispatch({ type: 'objectives/fetchObjectives/rejected', payload: errorMessage });
  }
};

export const fetchHighImpactObjectivesAsync = () => async (dispatch: Dispatch) => {
  try {
    dispatch({ type: 'objectives/fetchHighImpactObjectives/pending' });
    // Remplacez cette ligne par votre appel API réel
    const objectives = {} as Record<string, Objective>; // Temporaire, à remplacer par votre appel API
    dispatch({ type: 'objectives/fetchHighImpactObjectives/fulfilled', payload: objectives });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    dispatch({ type: 'objectives/fetchHighImpactObjectives/rejected', payload: errorMessage });
  }
};
