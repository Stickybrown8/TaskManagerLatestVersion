import { createSlice, PayloadAction, createAction, Dispatch } from '@reduxjs/toolkit';
import { RootState } from '..';

// Définition des interfaces pour les types
export interface Timer {
  _id: string;
  duration: number;
  isRunning: boolean;
  startTime?: Date;
  taskId?: string;
  clientId?: string;
}

interface TimerState {
  clientTimers: Record<string, Timer>;
  taskTimers: Record<string, Timer>;
  currentTimer: Timer | null;
  runningTimer: Timer | null;
  showTimerPopup: boolean; // Assurez-vous que cette ligne existe
  timerPopupSize: 'small' | 'medium' | 'large';
  timerPopupPosition: 'top-right' | 'bottom-right' | 'center';
  loading: boolean;
  error: string | null;
}

// Définition du type AppThunk si non exporté depuis '..'
export type AppThunk = (dispatch: Dispatch, getState: () => RootState) => void;

// Fonction utilitaire pour gérer les dates potentiellement undefined
const safeDate = (date: Date | undefined | null): Date => {
  if (!date) return new Date();
  try {
    return new Date(date instanceof Date ? date : new Date(date));
  } catch (error) {
    return new Date();
  }
};

// Simuler les fonctions d'API si elles ne sont pas disponibles
// Ces fonctions devraient être remplacées par les véritables implémentations
const fetchClientTimersFromAPI = async (): Promise<Record<string, Timer>> => {
  // Simulation - à remplacer par l'appel API réel
  return {};
};

const fetchTaskTimersFromAPI = async (): Promise<Record<string, Timer>> => {
  // Simulation - à remplacer par l'appel API réel
  return {};
};

// État initial
const initialState: TimerState = {
  clientTimers: {},
  taskTimers: {},
  currentTimer: null,
  runningTimer: null,
  showTimerPopup: false, // Assurez-vous que cette ligne existe
  timerPopupSize: 'medium',
  timerPopupPosition: 'bottom-right',
  loading: false,
  error: null
};

// Actions pour les opérations asynchrones
const fetchClientTimersPending = createAction('timer/fetchClientTimers/pending');
const fetchClientTimersFulfilled = createAction<Record<string, Timer>>('timer/fetchClientTimers/fulfilled');
const fetchClientTimersRejected = createAction<string>('timer/fetchClientTimers/rejected');

const fetchTaskTimersPending = createAction('timer/fetchTaskTimers/pending');
const fetchTaskTimersFulfilled = createAction<Record<string, Timer>>('timer/fetchTaskTimers/fulfilled');
const fetchTaskTimersRejected = createAction<string>('timer/fetchTaskTimers/rejected');

const fetchRunningTimerPending = createAction('timer/fetchRunningTimer/pending');
const fetchRunningTimerFulfilled = createAction('timer/fetchRunningTimer/fulfilled');
const fetchRunningTimerRejected = createAction<string>('timer/fetchRunningTimer/rejected');

// Création du slice
const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    // Définir le timer actuel
    setCurrentTimer: (state, action: PayloadAction<Timer | null>) => {
      state.currentTimer = action.payload;
    },

    // Définir le timer en cours d'exécution
    setRunningTimer: (state, action: PayloadAction<Timer | null>) => {
      state.runningTimer = action.payload;
    },

    // Mettre à jour la durée d'un timer en cours
    updateRunningTimerDuration: (state) => {
      if (state.currentTimer && state.currentTimer.isRunning && state.currentTimer.startTime) {
        // Utiliser safeDate pour éviter l'erreur TypeScript
        const startTime = safeDate(state.currentTimer.startTime);
        const currentTime = new Date();
        const elapsedTime = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);

        const type = state.currentTimer.clientId ? 'client' : 'task';
        const timerId = state.currentTimer.clientId || state.currentTimer.taskId;

        if (timerId) {
          const timers = type === 'client' ? state.clientTimers : state.taskTimers;
          if (timers[timerId]) {
            timers[timerId].duration = elapsedTime;
            state.currentTimer.duration = elapsedTime;

            // Mettre à jour également runningTimer si c'est le même timer
            if (state.runningTimer &&
              ((type === 'client' && state.runningTimer.clientId === timerId) ||
                (type === 'task' && state.runningTimer.taskId === timerId))) {
              state.runningTimer.duration = elapsedTime;
            }
          }
        }
      }
    },

    // Afficher/masquer la popup de timer
    toggleTimerPopup: (state, action: PayloadAction<boolean>) => {
      console.log("🔧 Reducer toggleTimerPopup appelé avec:", action.payload);
      console.log("🔧 État avant:", state.showTimerPopup);
      state.showTimerPopup = action.payload;
      console.log("🔧 État après:", state.showTimerPopup);
    },

    // Définir la taille de la popup de timer
    setTimerPopupSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.timerPopupSize = action.payload;
    },

    // Définir la position de la popup de timer
    setTimerPopupPosition: (state, action: PayloadAction<'top-right' | 'bottom-right' | 'center'>) => {
      state.timerPopupPosition = action.payload;
    },

    // Mettre à jour le statut d'un timer
    updateTimerStatus: (state, action: PayloadAction<{ timerId: string; type: 'client' | 'task'; isRunning: boolean }>) => {
      const { timerId, type, isRunning } = action.payload;
      const timers = type === 'client' ? state.clientTimers : state.taskTimers;

      if (timers[timerId]) {
        timers[timerId].isRunning = isRunning;
        if (isRunning) {
          timers[timerId].startTime = new Date();

          // Si le timer est démarré, le définir comme runningTimer
          state.runningTimer = timers[timerId];
        } else if (state.runningTimer &&
          ((type === 'client' && state.runningTimer.clientId === timerId) ||
            (type === 'task' && state.runningTimer.taskId === timerId))) {
          // Si le timer est arrêté et qu'il s'agit du runningTimer, réinitialiser runningTimer
          state.runningTimer = null;
        }
      }
    },

    // Mettre à jour le timer actuel s'il correspond
    updateCurrentTimerIfMatches: (state, action: PayloadAction<{ timerId: string; type: 'client' | 'task'; isRunning: boolean }>) => {
      const { timerId, type, isRunning } = action.payload;

      if (state.currentTimer) {
        const currentTimerId = type === 'client' ? state.currentTimer.clientId : state.currentTimer.taskId;

        if (currentTimerId === timerId) {
          state.currentTimer.isRunning = isRunning;
          if (isRunning) {
            state.currentTimer.startTime = new Date();
          }
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Gestion des timers clients
      .addCase(fetchClientTimersPending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientTimersFulfilled, (state, action) => {
        state.loading = false;
        state.clientTimers = action.payload;
      })
      .addCase(fetchClientTimersRejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Gestion des timers de tâches
      .addCase(fetchTaskTimersPending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaskTimersFulfilled, (state, action) => {
        state.loading = false;
        state.taskTimers = action.payload;
      })
      .addCase(fetchTaskTimersRejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Gestion du timer en cours
      .addCase(fetchRunningTimerPending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRunningTimerFulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchRunningTimerRejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export des actions
export const {
  setCurrentTimer,
  setRunningTimer,
  updateRunningTimerDuration,
  toggleTimerPopup,
  setTimerPopupSize,
  setTimerPopupPosition,
  updateTimerStatus,
  updateCurrentTimerIfMatches
} = timerSlice.actions;

// Thunks pour les opérations asynchrones
export const fetchClientTimers = (): AppThunk => async (dispatch) => {
  try {
    dispatch(fetchClientTimersPending());
    const clientTimers = await fetchClientTimersFromAPI();
    dispatch(fetchClientTimersFulfilled(clientTimers));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    dispatch(fetchClientTimersRejected(errorMessage));
  }
};

export const fetchTaskTimers = (): AppThunk => async (dispatch) => {
  try {
    dispatch(fetchTaskTimersPending());
    const taskTimers = await fetchTaskTimersFromAPI();
    dispatch(fetchTaskTimersFulfilled(taskTimers));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    dispatch(fetchTaskTimersRejected(errorMessage));
  }
};

export const fetchRunningTimer = (): AppThunk => async (dispatch) => {
  try {
    dispatch(fetchRunningTimerPending());

    // Vérifier d'abord les timers clients
    const clientTimers = await fetchClientTimersFromAPI();
    const runningClientTimer = Object.values(clientTimers).find(timer => timer.isRunning);

    if (runningClientTimer) {
      // Si un timer client est en cours d'exécution, le définir comme timer actuel et comme runningTimer
      dispatch(setCurrentTimer(runningClientTimer));
      dispatch(setRunningTimer(runningClientTimer));
    } else {
      // Sinon, vérifier les timers de tâches
      const taskTimers = await fetchTaskTimersFromAPI();
      const runningTaskTimer = Object.values(taskTimers).find(timer => timer.isRunning);

      if (runningTaskTimer) {
        dispatch(setCurrentTimer(runningTaskTimer));
        dispatch(setRunningTimer(runningTaskTimer));
      }
    }

    dispatch(fetchRunningTimerFulfilled());
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
    dispatch(fetchRunningTimerRejected(errorMessage));
  }
};

// Fonction hideTimerPopup ajoutée (utilise toggleTimerPopup avec false)
export const hideTimerPopup = (): AppThunk => (dispatch) => {
  dispatch(toggleTimerPopup(false));
};

// Fonction pauseTimer ajoutée
export const pauseTimer = (timerId: string, type: 'client' | 'task'): AppThunk => async (dispatch) => {
  try {
    // Mettre à jour l'état local
    dispatch(updateTimerStatus({ timerId, type, isRunning: false }));

    // Mettre à jour le timer actuel si c'est celui qui est en cours
    dispatch(updateCurrentTimerIfMatches({ timerId, type, isRunning: false }));

    // Appel API pour mettre à jour le timer sur le serveur
    // Si vous n'avez pas de timerService, vous pouvez commenter cette ligne
    // await timerService.pauseTimer(timerId, type);
  } catch (error) {
    console.error('Erreur lors de la mise en pause du timer:', error);
  }
};

// Fonction startTimer ajoutée
export const startTimer = (timerId: string, type: 'client' | 'task'): AppThunk => async (dispatch) => {
  try {
    // Mettre à jour l'état local
    dispatch(updateTimerStatus({ timerId, type, isRunning: true }));

    // Mettre à jour le timer actuel si c'est celui qui est en cours
    dispatch(updateCurrentTimerIfMatches({ timerId, type, isRunning: true }));

    // Appel API pour mettre à jour le timer sur le serveur
    // Si vous n'avez pas de timerService, vous pouvez commenter cette ligne
    // await timerService.startTimer(timerId, type);
  } catch (error) {
    console.error('Erreur lors du démarrage du timer:', error);
  }
};

// Fonction resumeTimer ajoutée (identique à startTimer mais avec un nom différent)
export const resumeTimer = (timerId: string, type: 'client' | 'task'): AppThunk => async (dispatch) => {
  try {
    // Mettre à jour l'état local
    dispatch(updateTimerStatus({ timerId, type, isRunning: true }));

    // Mettre à jour le timer actuel si c'est celui qui est en cours
    dispatch(updateCurrentTimerIfMatches({ timerId, type, isRunning: true }));

    // Appel API pour mettre à jour le timer sur le serveur
    // Si vous n'avez pas de timerService, vous pouvez commenter cette ligne
    // await timerService.resumeTimer(timerId, type);
  } catch (error) {
    console.error('Erreur lors de la reprise du timer:', error);
  }
};

// Fonction stopTimer ajoutée (similaire à pauseTimer mais peut réinitialiser le timer)
export const stopTimer = (timerId: string, type: 'client' | 'task', reset: boolean = false): AppThunk => async (dispatch) => {
  try {
    // Mettre à jour l'état local
    dispatch(updateTimerStatus({ timerId, type, isRunning: false }));

    // Mettre à jour le timer actuel si c'est celui qui est en cours
    dispatch(updateCurrentTimerIfMatches({ timerId, type, isRunning: false }));

    // Si reset est true, réinitialiser la durée du timer
    if (reset) {
      // Cette partie nécessiterait un nouveau reducer pour réinitialiser la durée
      // Pour l'instant, nous nous contentons d'arrêter le timer
    }

    // Appel API pour mettre à jour le timer sur le serveur
    // Si vous n'avez pas de timerService, vous pouvez commenter cette ligne
    // await timerService.stopTimer(timerId, type, reset);
  } catch (error) {
    console.error('Erreur lors de l\'arrêt du timer:', error);
  }
};

export default timerSlice.reducer;
