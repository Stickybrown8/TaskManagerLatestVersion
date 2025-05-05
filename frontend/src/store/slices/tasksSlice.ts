import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
}

// État initial
const initialState: TasksState = {
  tasks: [],
  currentTask: null,
  filteredTasks: [],
  filters: {},
  loading: false,
  error: null,
};

// Slice
const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    fetchTasksStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchTasksSuccess: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      state.filteredTasks = applyFilters(action.payload, state.filters);
      state.loading = false;
    },
    fetchTasksFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
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
    setTaskFilters: (state, action: PayloadAction<TasksState['filters']>) => {
      state.filters = action.payload;
      state.filteredTasks = applyFilters(state.tasks, action.payload);
    },
    clearTaskFilters: (state) => {
      state.filters = {};
      state.filteredTasks = [...state.tasks];
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
  },
});

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

// Reducer
export default tasksSlice.reducer;
