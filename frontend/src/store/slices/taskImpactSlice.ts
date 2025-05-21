// === Ce fichier gère l'identification et le suivi des tâches à fort impact (règle 80/20) === /workspaces/TaskManagerLatestVersion/frontend/src/store/slices/taskImpactSlice.ts
// Explication simple : Ce fichier est comme un détecteur de super-tâches qui t'aide à trouver les 20% de tâches qui produisent 80% des résultats, comme quand tu tries tes jouets pour garder seulement ceux avec lesquels tu joues vraiment.
// Explication technique : Module Redux Toolkit qui définit un "slice" pour gérer l'état des tâches à fort impact selon le principe de Pareto, utilisant l'API createSlice et createAsyncThunk pour encapsuler la logique d'analyse d'impact.
// Utilisé dans : Les composants qui affichent ou analysent les tâches à fort impact comme HighImpactTasksList, TaskImpactAnalysis, et les tableaux de bord qui présentent des priorités.
// Connecté à : Store Redux principal, service d'impact des tâches (taskImpactService) via les API, et composants React qui utilisent ces données via useSelector/useDispatch.

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { taskImpactService } from '../../services/api';

// === Début : Définition des types pour les tâches à impact ===
// Explication simple : Ces lignes décrivent ce qu'est une tâche importante, comme une liste des informations que tu dois savoir pour reconnaître tes jouets préférés.
// Explication technique : Interfaces TypeScript qui définissent la structure des tâches, des mises à jour d'impact, et des résultats d'analyse, fournissant une sécurité de type pour toutes les opérations.
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
// === Fin : Définition des types pour les tâches à impact ===

// === Début : Définition des thunks pour les opérations API ===
// Explication simple : Ces fonctions sont comme des assistants spéciaux qui vont parler à la base de données pour trouver les tâches les plus importantes ou analyser lesquelles devraient l'être.
// Explication technique : Collection de thunks asynchrones créés avec createAsyncThunk qui encapsulent les appels à l'API d'impact des tâches, avec typage fort et gestion des erreurs.
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
// === Fin : Définition des thunks pour les opérations API ===

// === Début : Configuration de l'état initial ===
// Explication simple : Ces lignes préparent l'état de départ - au début, tu n'as pas encore identifié de tâches importantes et tu n'as pas encore fait d'analyse.
// Explication technique : Objet définissant l'état initial du slice d'impact des tâches avec toutes les propriétés à leurs valeurs par défaut, utilisé lors de l'initialisation du store Redux.
// État initial
const initialState: TaskImpactState = {
  highImpactTasks: [],
  impactAnalysis: null,
  loading: false,
  error: null,
  applyingAnalysis: false,
  analysisApplied: false
};
// === Fin : Configuration de l'état initial ===

// === Début : Création du slice d'impact des tâches ===
// Explication simple : Ce bloc crée une grande boîte magique qui contient toutes les actions possibles pour gérer les tâches importantes - les trouver, les changer, les analyser.
// Explication technique : Utilisation de createSlice de Redux Toolkit pour définir les reducers standards et extraReducers qui gèrent l'état d'impact des tâches en réponse à diverses actions.
// Slice
const taskImpactSlice = createSlice({
  name: 'taskImpact',
  initialState,
  reducers: {
    // === Début : Actions pour gérer les erreurs et l'état d'analyse ===
    // Explication simple : Ces actions permettent d'effacer les messages d'erreur et de réinitialiser l'état après avoir appliqué une analyse.
    // Explication technique : Reducers simples qui modifient l'état d'erreur et l'état d'analyse, utilisés pour gérer l'interface utilisateur et les transitions entre les états.
    clearTaskImpactError: (state) => {
      state.error = null;
    },
    resetAnalysisApplied: (state) => {
      state.analysisApplied = false;
    }
    // === Fin : Actions pour gérer les erreurs et l'état d'analyse ===
  },
  extraReducers: (builder) => {
    builder
      // === Début : Reducers pour récupérer les tâches à fort impact ===
      // Explication simple : Ces actions gèrent quand tu demandes à voir toutes les tâches importantes - elles disent "je cherche", puis "voici la liste" ou "je n'ai pas pu les trouver".
      // Explication technique : Ensemble de reducers qui gèrent le cycle de vie (pending, fulfilled, rejected) de la requête asynchrone fetchHighImpactTasks.
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
      // === Fin : Reducers pour récupérer les tâches à fort impact ===

      // === Début : Reducers pour mettre à jour l'impact d'une tâche ===
      // Explication simple : Ces actions gèrent quand tu changes l'importance d'une tâche - elles mettent à jour sa priorité et réorganisent ta liste des tâches importantes.
      // Explication technique : Groupe de reducers qui gèrent la mise à jour d'une tâche spécifique, maintenant la cohérence entre les différentes collections d'état.
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
      // === Fin : Reducers pour mettre à jour l'impact d'une tâche ===

      // === Début : Reducers pour analyser l'impact des tâches ===
      // Explication simple : Ces actions gèrent quand tu demandes à l'ordinateur d'analyser toutes tes tâches pour te dire lesquelles sont vraiment importantes, comme un conseiller qui t'aide à trier.
      // Explication technique : Ensemble de reducers qui contrôlent l'analyse algorithmique des tâches selon leur impact potentiel et leur stockage dans l'état.
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
      // === Fin : Reducers pour analyser l'impact des tâches ===

      // === Début : Reducers pour appliquer l'analyse d'impact ===
      // Explication simple : Ces actions gèrent quand tu veux appliquer les recommandations - comme quand tu réorganises tes jouets selon les conseils d'un ami.
      // Explication technique : Groupe complexe de reducers qui appliquent les résultats d'une analyse d'impact, mettant à jour plusieurs tâches à la fois et maintenant la cohérence dans l'état.
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
      // === Fin : Reducers pour appliquer l'analyse d'impact ===
  }
});
// === Fin : Création du slice d'impact des tâches ===

// === Début : Exportation des actions et du reducer ===
// Explication simple : Ces lignes rendent les actions disponibles pour le reste de l'application et le système de gestion d'impact au complet.
// Explication technique : Destructuration et exportation des créateurs d'actions générés par createSlice et du reducer complet, permettant leur utilisation dans les composants et le store Redux.
export const { clearTaskImpactError, resetAnalysisApplied } = taskImpactSlice.actions;

export default taskImpactSlice.reducer;
// === Fin : Exportation des actions et du reducer ===
