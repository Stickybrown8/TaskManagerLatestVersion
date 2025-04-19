import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { taskImpactService } from '../../services/api';

// Définition des interfaces pour les types
interface Task {
  _id: string;
  title: string;
  description?: string;
  clientId: string;
  isHighImpact: boolean;
  impactScore: number;
  deadline?: string;
  status: string;
}

interface TaskUpdate {
  taskId: string;
  isHighImpact: boolean;
  impactScore: number;
}

interface ImpactAnalysis {
  allTasksWithScores: Array<{
    _id: string;
    title: string;
    isCurrentlyHighImpact: boolean;
    currentImpactScore: number;
    recommendedImpactScore: number;
    shouldBeHighImpact: boolean;
  }>;
  recommendedHighImpactTasks: Array<{
    _id: string;
    title: string;
    recommendedImpactScore: number;
  }>;
}

interface TaskImpactState {
  highImpactTasks: Task[];
  impactAnalysis: ImpactAnalysis | null;
  loading: boolean;
  error: string | null;
  applyingAnalysis: boolean;
  analysisApplied: boolean;
}

// Thunks
export const fetchHighImpactTasks = createAsyncThunk<
  Task[],
  void,
  { rejectValue: string }
>(
  'taskImpact/fetchHighImpact',
  async (_, { rejectWithValue }) => {
    try {
      const tasks = await taskImpactService.getHighImpactTasks();
      return tasks;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Erreur lors de la récupération des tâches à fort impact');
    }
  }
);

export const updateTaskImpact = createAsyncThunk<
  Task,
  TaskUpdate,
  { rejectValue: string }
>(
  'taskImpact/updateImpact',
  async ({ taskId, isHighImpact, impactScore }: TaskUpdate, { rejectWithValue }) => {
    try {
      const task = await taskImpactService.updateTaskImpact(taskId, isHighImpact, impactScore);
      return task;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Erreur lors de la mise à jour de l\'impact de la tâche');
    }
  }
);

export const analyzeTasksImpact = createAsyncThunk<
  ImpactAnalysis,
  void,
  { rejectValue: string }
>(
  'taskImpact/analyzeImpact',
  async (_, { rejectWithValue }) => {
    try {
      const analysis = await taskImpactService.analyzeTasksImpact();
      return analysis;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Erreur lors de l\'analyse de l\'impact des tâches');
    }
  }
);

export const applyImpactAnalysis = createAsyncThunk<
  { results: Array<{ success: boolean, task: Task }> },
  TaskUpdate[],
  { rejectValue: string }
>(
  'taskImpact/applyAnalysis',
  async (taskUpdates: TaskUpdate[], { rejectWithValue }) => {
    try {
      const result = await taskImpactService.applyImpactAnalysis(taskUpdates);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.msg || 'Erreur lors de l\'application de l\'analyse d\'impact');
    }
  }
);

// État initial
const initialState: TaskImpactState = {
  highImpactTasks: [],
  impactAnalysis: null,
  loading: false,
  error: null,
  applyingAnalysis: false,
  analysisApplied: false
};

// Slice
const taskImpactSlice = createSlice({
  name: 'taskImpact',
  initialState,
  reducers: {
    clearTaskImpactError: (state) => {
      state.error = null;
    },
    resetAnalysisApplied: (state) => {
      state.analysisApplied = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchHighImpactTasks
      .addCase(fetchHighImpactTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHighImpactTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.loading = false;
        state.highImpactTasks = action.payload;
      })
      .addCase(fetchHighImpactTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Une erreur est survenue';
      })

      // updateTaskImpact
      .addCase(updateTaskImpact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaskImpact.fulfilled, (state, action: PayloadAction<Task>) => {
        state.loading = false;

        // Mettre à jour la tâche dans la liste des tâches à fort impact
        const index = state.highImpactTasks.findIndex(task => task._id === action.payload._id);

        if (action.payload.isHighImpact) {
          if (index === -1) {
            // Ajouter la tâche à la liste si elle est maintenant à fort impact
            state.highImpactTasks.push(action.payload);
          } else {
            // Mettre à jour la tâche existante
            state.highImpactTasks[index] = action.payload;
          }
        } else if (index !== -1) {
          // Retirer la tâche de la liste si elle n'est plus à fort impact
          state.highImpactTasks.splice(index, 1);
        }

        // Mettre à jour la tâche dans l'analyse d'impact si elle existe
        if (state.impactAnalysis) {
          const allTasks = state.impactAnalysis.allTasksWithScores;
          const taskIndex = allTasks.findIndex(task => task._id === action.payload._id);

          if (taskIndex !== -1) {
            allTasks[taskIndex] = {
              ...allTasks[taskIndex],
              isCurrentlyHighImpact: action.payload.isHighImpact,
              currentImpactScore: action.payload.impactScore
            };
          }
        }
      })
      .addCase(updateTaskImpact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Une erreur est survenue';
      })

      // analyzeTasksImpact
      .addCase(analyzeTasksImpact.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeTasksImpact.fulfilled, (state, action: PayloadAction<ImpactAnalysis>) => {
        state.loading = false;
        state.impactAnalysis = action.payload;
      })
      .addCase(analyzeTasksImpact.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Une erreur est survenue';
      })

      // applyImpactAnalysis
      .addCase(applyImpactAnalysis.pending, (state) => {
        state.applyingAnalysis = true;
        state.error = null;
      })
      .addCase(applyImpactAnalysis.fulfilled, (state, action: PayloadAction<{ results: Array<{ success: boolean, task: Task }> }>) => {
        state.applyingAnalysis = false;
        state.analysisApplied = true;

        // Mettre à jour les tâches à fort impact
        const updatedTasks = action.payload.results.filter(result => result.success);

        updatedTasks.forEach(result => {
          const task = result.task;

          // Mettre à jour la liste des tâches à fort impact
          const index = state.highImpactTasks.findIndex(t => t._id === task._id);

          if (task.isHighImpact) {
            if (index === -1) {
              // Ajouter la tâche si elle est maintenant à fort impact
              // Note: Nous n'avons que des informations partielles ici, donc nous devrons peut-être
              // récupérer la liste complète des tâches à fort impact après l'application
              state.highImpactTasks.push(task);
            } else {
              // Mettre à jour les propriétés d'impact
              state.highImpactTasks[index] = {
                ...state.highImpactTasks[index],
                isHighImpact: task.isHighImpact,
                impactScore: task.impactScore
              };
            }
          } else if (index !== -1) {
            // Retirer la tâche si elle n'est plus à fort impact
            state.highImpactTasks.splice(index, 1);
          }

          // Mettre à jour l'analyse d'impact si elle existe
          if (state.impactAnalysis) {
            const allTasks = state.impactAnalysis.allTasksWithScores;
            const taskIndex = allTasks.findIndex(t => t._id === task._id);

            if (taskIndex !== -1) {
              allTasks[taskIndex] = {
                ...allTasks[taskIndex],
                isCurrentlyHighImpact: task.isHighImpact,
                currentImpactScore: task.impactScore
              };
            }
          }
        });
      })
      .addCase(applyImpactAnalysis.rejected, (state, action) => {
        state.applyingAnalysis = false;
        state.error = action.payload || 'Une erreur est survenue';
      });
  }
});

export const { clearTaskImpactError, resetAnalysisApplied } = taskImpactSlice.actions;

export default taskImpactSlice.reducer;
