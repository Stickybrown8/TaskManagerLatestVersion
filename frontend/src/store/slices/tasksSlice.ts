// === Ce fichier gère toutes les tâches dans l'application === /workspaces/TaskManagerLatestVersion/frontend/src/store/slices/tasksSlice.ts
// Explication simple : Ce fichier est comme un grand carnet qui garde en mémoire toutes tes tâches, te permet d'en ajouter de nouvelles, de les modifier ou de les supprimer.
// Explication technique : Module Redux Toolkit qui définit un "slice" pour gérer l'état des tâches, utilisant l'API createSlice pour encapsuler la logique de réduction et les opérations CRUD sur les tâches.
// Utilisé dans : Les composants qui affichent ou modifient des tâches comme TaskList, TaskDetail, TaskForm, et tous les tableaux de bord qui montrent des tâches.
// Connecté à : Store Redux principal, actions de tâches, services API pour les tâches, et composants React qui utilisent les données de tâches via useSelector/useDispatch.

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// === Début : Définition du type de tâche ===
// Explication simple : Ces lignes décrivent à quoi ressemble une tâche, avec son titre, sa description, ses dates et toutes les informations qu'on doit savoir à son sujet.
// Explication technique : Interface TypeScript qui définit la structure complète d'une tâche avec toutes ses propriétés et relations, établissant un contrat type pour l'ensemble de l'application.
// Types
interface Task {
  _id: string;
  clientId: string;
  title: string;
  description: string;
  category: 'campagne' | 'landing' | 'rapport' | 'email' | 'reunion' | 'tracking' | 'cro';
  priority: 'basse' | 'moyenne' | 'haute' | 'urgente';
  status: 'à faire' | 'en cours' | 'terminée';
  createdAt: string;
  dueDate: string;
  completedAt?: string;
  actionPoints: number;
  recurring?: {
    isRecurring: boolean;
    frequency?: 'quotidien' | 'hebdomadaire' | 'mensuel';
    interval?: number;
    endDate?: string;
  };
  reminders?: {
    time: string;
    sent: boolean;
  }[];
  subtasks?: {
    title: string;
    completed: boolean;
    completedAt?: string;
  }[];
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  history?: {
    action: string;
    timestamp: string;
    details: any;
  }[];
}
// === Fin : Définition du type de tâche ===

// === Début : Définition de l'état des tâches ===
// Explication simple : Ces lignes décrivent comment on organise et stocke toutes les informations sur les tâches, comme une grande boîte avec différents compartiments.
// Explication technique : Interface TypeScript qui définit la structure de l'état complet géré par le slice des tâches, incluant les collections de tâches, l'état de chargement et les filtres.
interface TasksState {
  tasks: Task[];
  currentTask: Task | null;
  filteredTasks: Task[];
  filters: {
    status?: string;
    clientId?: string;
    category?: string;
    priority?: string;
    dueDate?: string;
  };
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}
// === Fin : Définition de l'état des tâches ===

// === Début : Configuration de l'état initial ===
// Explication simple : Ces lignes préparent l'état de départ - au début, ta liste de tâches est vide, rien n'est sélectionné, et rien ne charge.
// Explication technique : Objet définissant l'état initial du slice des tâches avec toutes les propriétés à leurs valeurs par défaut, utilisé lors de l'initialisation du store Redux.
// État initial
const initialState: TasksState = {
  tasks: [],
  currentTask: null,
  filteredTasks: [],
  filters: {},
  loading: false,
  error: null,
  lastFetched: null,
};
// === Fin : Configuration de l'état initial ===

// === Début : Création du slice des tâches ===
// Explication simple : Ce bloc crée une grande boîte magique qui contient toutes les actions possibles pour gérer tes tâches - les chercher, en ajouter, les modifier ou les supprimer.
// Explication technique : Utilisation de createSlice de Redux Toolkit pour définir un ensemble de reducers qui modifient l'état des tâches en réponse à diverses actions.
// Slice
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // === Début : Actions pour récupérer toutes les tâches ===
    // Explication simple : Ces actions gèrent quand tu demandes à voir toutes tes tâches - elles disent "je cherche", puis "voici la liste" ou "je n'ai pas pu les trouver".
    // Explication technique : Trio de reducers qui gèrent le cycle de vie d'une requête asynchrone pour récupérer toutes les tâches, avec mise à jour des filtres et marquage du temps.
    fetchTasksStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchTasksSuccess: (state, action) => {
      state.tasks = action.payload;
      state.filteredTasks = applyFilters(action.payload, state.filters);
      state.loading = false;
      state.error = null;
      state.lastFetched = Date.now();
    },
    fetchTasksFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour récupérer toutes les tâches ===
    
    // === Début : Actions pour récupérer une tâche spécifique ===
    // Explication simple : Ces actions gèrent quand tu demandes à voir une seule tâche en détail - elles disent "je cherche cette tâche particulière", puis montrent les détails ou signalent un problème.
    // Explication technique : Ensemble de reducers qui contrôlent le flux d'une requête pour une tâche unique, identifiée par son ID, modifiant l'état currentTask en conséquence.
    fetchTaskStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchTaskSuccess: (state, action: PayloadAction<Task>) => {
      state.currentTask = action.payload;
      state.loading = false;
    },
    fetchTaskFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour récupérer une tâche spécifique ===
    
    // === Début : Actions pour créer une nouvelle tâche ===
    // Explication simple : Ces actions gèrent quand tu veux ajouter une nouvelle tâche à ta liste - elles disent "je crée", puis "c'est fait" ou "ça n'a pas marché".
    // Explication technique : Séquence de reducers qui orchestrent la création d'une nouvelle tâche, avec ajout à l'array tasks et mise à jour des tâches filtrées.
    createTaskStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    createTaskSuccess: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
      state.filteredTasks = applyFilters(state.tasks, state.filters);
      state.loading = false;
    },
    createTaskFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour créer une nouvelle tâche ===
    
    // === Début : Actions pour mettre à jour une tâche ===
    // Explication simple : Ces actions gèrent quand tu modifies les informations d'une tâche - elles disent "je change des infos", puis "j'ai mis à jour" ou "je n'ai pas pu changer ça".
    // Explication technique : Groupe de reducers qui gèrent la mise à jour d'une tâche existante, avec recherche par ID et modification immutable de l'objet correspondant.
    updateTaskStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateTaskSuccess: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(task => task._id === action.payload._id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
      if (state.currentTask && state.currentTask._id === action.payload._id) {
        state.currentTask = action.payload;
      }
      state.filteredTasks = applyFilters(state.tasks, state.filters);
      state.loading = false;
    },
    updateTaskFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour mettre à jour une tâche ===
    
    // === Début : Actions pour supprimer une tâche ===
    // Explication simple : Ces actions gèrent quand tu veux retirer une tâche de ta liste - elles disent "je supprime", puis "c'est effacé" ou "je n'ai pas pu supprimer".
    // Explication technique : Ensemble de reducers qui gèrent la suppression d'une tâche via son ID, avec filtrage immutable du tableau tasks pour retirer l'élément correspondant.
    deleteTaskStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteTaskSuccess: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task._id !== action.payload);
      if (state.currentTask && state.currentTask._id === action.payload) {
        state.currentTask = null;
      }
      state.filteredTasks = applyFilters(state.tasks, state.filters);
      state.loading = false;
    },
    deleteTaskFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour supprimer une tâche ===
    
    // === Début : Actions pour filtrer les tâches ===
    // Explication simple : Ces actions gèrent quand tu veux voir seulement certains types de tâches - comme quand tu demandes à voir uniquement tes devoirs de maths, ou seulement les tâches urgentes.
    // Explication technique : Pair de reducers qui appliquent et effacent les filtres sur la collection de tâches, utilisant la fonction utilitaire applyFilters pour maintenir filteredTasks synchronisé.
    setTaskFilters: (state, action: PayloadAction<TasksState['filters']>) => {
      state.filters = action.payload;
      state.filteredTasks = applyFilters(state.tasks, action.payload);
    },
    clearTaskFilters: (state) => {
      state.filters = {};
      state.filteredTasks = [...state.tasks];
    },
    // === Fin : Actions pour filtrer les tâches ===
    
    // === Début : Actions utilitaires pour les tâches ===
    // Explication simple : Ces actions font des petites choses pratiques - comme effacer la tâche que tu es en train de regarder ou ajouter rapidement une nouvelle tâche.
    // Explication technique : Reducers simples pour gérer des opérations d'utilité comme la réinitialisation de la tâche courante ou l'ajout rapide d'une tâche en tête de liste.
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    addTask: (state, action) => {
      state.tasks.unshift(action.payload);
      state.filteredTasks = applyFilters(state.tasks, state.filters);
    },
    // === Fin : Actions utilitaires pour les tâches ===
  },
});
// === Fin : Création du slice des tâches ===

// === Début : Fonction utilitaire pour le filtrage des tâches ===
// Explication simple : Cette fonction est comme un tamis magique qui ne laisse passer que les tâches qui correspondent à ce que tu cherches - comme si tu triais tes jouets par couleur ou par taille.
// Explication technique : Fonction pure qui implémente la logique de filtrage sur un array de tâches selon plusieurs critères, retournant un nouvel array sans modifier l'original.
// Fonction utilitaire pour appliquer les filtres
const applyFilters = (tasks: Task[], filters: TasksState['filters']) => {
  return tasks.filter(task => {
    // Filtre par statut
    if (filters.status && task.status !== filters.status) {
      return false;
    }
    
    // Filtre par client
    if (filters.clientId && task.clientId !== filters.clientId) {
      return false;
    }
    
    // Filtre par catégorie
    if (filters.category && task.category !== filters.category) {
      return false;
    }
    
    // Filtre par priorité
    if (filters.priority && task.priority !== filters.priority) {
      return false;
    }
    
    // Filtre par date d'échéance
    if (filters.dueDate) {
      const dueDate = new Date(task.dueDate);
      const filterDate = new Date(filters.dueDate);
      
      if (
        dueDate.getFullYear() !== filterDate.getFullYear() ||
        dueDate.getMonth() !== filterDate.getMonth() ||
        dueDate.getDate() !== filterDate.getDate()
      ) {
        return false;
      }
    }
    
    return true;
  });
};
// === Fin : Fonction utilitaire pour le filtrage des tâches ===

// === Début : Exportation des actions ===
// Explication simple : Ces lignes rendent les actions disponibles pour que d'autres parties de l'application puissent les utiliser, comme une liste de commandes que tout le monde peut utiliser.
// Explication technique : Destructuration et exportation des créateurs d'actions générés automatiquement par createSlice, permettant leur utilisation dans les composants via useDispatch.
// Actions
export const {
  fetchTasksStart,
  fetchTasksSuccess,
  fetchTasksFailure,
  fetchTaskStart,
  fetchTaskSuccess,
  fetchTaskFailure,
  createTaskStart,
  createTaskSuccess,
  createTaskFailure,
  updateTaskStart,
  updateTaskSuccess,
  updateTaskFailure,
  deleteTaskStart,
  deleteTaskSuccess,
  deleteTaskFailure,
  setTaskFilters,
  clearTaskFilters,
  clearCurrentTask,
  addTask,
} = tasksSlice.actions;
// === Fin : Exportation des actions ===

// === Début : Exportation du reducer ===
// Explication simple : Cette ligne rend tout le système de gestion des tâches disponible pour le reste de l'application.
// Explication technique : Exportation par défaut du reducer généré par createSlice, qui sera combiné avec d'autres reducers dans le store Redux principal.
// Reducer
export default tasksSlice.reducer;
// === Fin : Exportation du reducer ===
