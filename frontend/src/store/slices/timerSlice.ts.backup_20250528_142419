// === Ce fichier gère tout ce qui concerne les chronomètres de l'application === /workspaces/TaskManagerLatestVersion/frontend/src/store/slices/timerSlice.ts
// Explication simple : Ce fichier est comme une horloge intelligente qui permet de mesurer combien de temps tu passes sur chaque tâche ou pour chaque client, comme un chronomètre que tu peux démarrer, arrêter et afficher n'importe où dans l'application.
// Explication technique : Module Redux Toolkit qui définit un "slice" pour gérer l'état des timers, utilisant l'API createSlice et des thunks pour encapsuler la logique de contrôle des chronomètres et leur affichage dans l'interface.
// Utilisé dans : Les composants qui affichent ou contrôlent des timers comme TaskTimer, TimerPopup, ClientTimerControls, et tout composant qui a besoin de suivre le temps passé.
// Connecté à : Store Redux principal, services API de timers (simulés ici), composants React qui utilisent les données de timer via useSelector/useDispatch, et potentiellement au service de profitabilité.

import { createSlice, PayloadAction, createAction, Dispatch } from '@reduxjs/toolkit';
import { RootState } from '..';

// === Début : Définition des types pour le timer ===
// Explication simple : Ces lignes décrivent à quoi ressemble un chronomètre, avec son identifiant, sa durée, s'il est en marche ou pas, et à quelle tâche ou client il est attaché.
// Explication technique : Interfaces TypeScript qui définissent la structure des objets Timer et de l'état global TimerState, établissant un contrat type pour les opérations de chronométrage.
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
// === Fin : Définition des types pour le timer ===

// === Début : Fonction utilitaire pour la sécurité des dates ===
// Explication simple : Cette fonction s'assure que les dates sont bien des dates, comme un parent qui vérifie que tu as bien mis des chaussettes avant tes chaussures.
// Explication technique : Fonction utilitaire qui gère les cas où la date pourrait être undefined ou null, retournant une date valide pour éviter les erreurs lors du calcul des durées.
// Fonction utilitaire pour gérer les dates potentiellement undefined
const safeDate = (date: Date | undefined | null): Date => {
  if (!date) return new Date();
  try {
    return new Date(date instanceof Date ? date : new Date(date));
  } catch (error) {
    return new Date();
  }
};
// === Fin : Fonction utilitaire pour la sécurité des dates ===

// === Début : Simulation des fonctions d'API ===
// Explication simple : Ces fonctions font semblant d'aller chercher des informations sur internet, comme quand tu joues à faire semblant d'être un marchand dans un magasin.
// Explication technique : Fonctions asynchrones de simulation pour remplacer temporairement les appels API réels, retournant des objets vides pour permettre le développement sans backend.
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
// === Fin : Simulation des fonctions d'API ===

// === Début : Configuration de l'état initial ===
// Explication simple : Ces lignes préparent l'état de départ - au début, il n'y a pas de chronomètres en marche, la petite fenêtre de chronomètre est cachée, et rien ne charge.
// Explication technique : Objet définissant l'état initial du slice de timer avec toutes les propriétés à leurs valeurs par défaut, utilisé lors de l'initialisation du store Redux.
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
// === Fin : Configuration de l'état initial ===

// === Début : Définition des actions asynchrones ===
// Explication simple : Ces lignes créent des messages spéciaux qui disent "je commence à chercher", "j'ai trouvé" ou "je n'ai pas réussi à trouver" les chronomètres.
// Explication technique : Création d'actions distinctes avec createAction pour gérer les trois états (pending, fulfilled, rejected) de chaque opération asynchrone sans utiliser createAsyncThunk.
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
// === Fin : Définition des actions asynchrones ===

// === Début : Création du slice des timers ===
// Explication simple : Ce grand bloc crée une boîte magique qui contient toutes les actions possibles pour gérer tes chronomètres - les démarrer, les arrêter, les afficher, etc.
// Explication technique : Utilisation de createSlice de Redux Toolkit pour définir les reducers standards et extraReducers qui modifient l'état des timers en réponse à diverses actions.
// Création du slice
const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    // === Début : Action pour définir le timer courant ===
    // Explication simple : Cette action permet de choisir quel chronomètre tu veux regarder en détail, comme quand tu décides de te concentrer sur un seul jouet.
    // Explication technique : Reducer qui met à jour la propriété currentTimer de l'état, permettant à l'interface de se concentrer sur un timer spécifique pour affichage ou manipulation.
    // Définir le timer actuel
    setCurrentTimer: (state, action: PayloadAction<Timer | null>) => {
      state.currentTimer = action.payload;
    },
    // === Fin : Action pour définir le timer courant ===

    // === Début : Action pour définir le timer en cours d'exécution ===
    // Explication simple : Cette action indique quel chronomètre est actuellement en marche, comme quand tu mets en évidence le chronomètre que tu as démarré.
    // Explication technique : Reducer qui met à jour la propriété runningTimer de l'état, permettant de suivre facilement quel timer est actif à travers l'application.
    // Définir le timer en cours d'exécution
    setRunningTimer: (state, action: PayloadAction<Timer | null>) => {
      state.runningTimer = action.payload;
    },
    // === Fin : Action pour définir le timer en cours d'exécution ===

    // === Début : Action pour mettre à jour la durée du timer actif ===
    // Explication simple : Cette action met à jour le temps écoulé sur un chronomètre en marche, comme quand tu regardes régulièrement combien de temps a passé.
    // Explication technique : Reducer complexe qui calcule la durée écoulée pour le timer en cours et met à jour cette valeur dans toutes les références pertinentes de l'état.
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
    // === Fin : Action pour mettre à jour la durée du timer actif ===

    // === Début : Action pour afficher/masquer la popup de timer ===
    // Explication simple : Cette action fait apparaître ou disparaître la petite fenêtre du chronomètre, comme quand tu ouvres ou fermes une boîte à jouets.
    // Explication technique : Reducer avec logs de débogage qui modifie la propriété showTimerPopup, contrôlant la visibilité du composant TimerPopup dans l'interface.
    // Afficher/masquer la popup de timer
    toggleTimerPopup: (state, action: PayloadAction<boolean>) => {
      console.log("🔧 Reducer toggleTimerPopup appelé avec:", action.payload);
      console.log("🔧 État avant:", state.showTimerPopup);
      
      // Assignation directe
      state.showTimerPopup = action.payload;
      
      console.log("🔧 État après assignation:", state.showTimerPopup);
    },
    // === Fin : Action pour afficher/masquer la popup de timer ===

    // === Début : Actions pour personnaliser l'apparence du popup ===
    // Explication simple : Ces actions permettent de changer la taille et la position de la petite fenêtre du chronomètre, comme quand tu décides où placer et quelle taille donner à ton jouet préféré.
    // Explication technique : Pair de reducers qui contrôlent les propriétés d'UI du popup de timer, permettant une personnalisation de l'expérience utilisateur.
    // Définir la taille de la popup de timer
    setTimerPopupSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.timerPopupSize = action.payload;
    },

    // Définir la position de la popup de timer
    setTimerPopupPosition: (state, action: PayloadAction<'top-right' | 'bottom-right' | 'center'>) => {
      state.timerPopupPosition = action.payload;
    },
    // === Fin : Actions pour personnaliser l'apparence du popup ===

    // === Début : Actions pour gérer l'état des timers ===
    // Explication simple : Ces actions permettent de démarrer ou arrêter un chronomètre spécifique et de s'assurer que tout le monde est au courant du changement.
    // Explication technique : Groupe de reducers qui gèrent la mise à jour du statut d'un timer et la propagation de ce changement à travers les différentes références dans l'état.
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
    // === Fin : Actions pour gérer l'état des timers ===
  },
  extraReducers: (builder) => {
    builder
      // === Début : Reducers pour récupérer les timers des clients ===
      // Explication simple : Ces actions gèrent quand tu demandes à voir tous les chronomètres des clients - elles disent "je cherche", puis "voici la liste" ou "je n'ai pas pu les trouver".
      // Explication technique : Groupe de reducers qui gèrent le cycle de vie (pending, fulfilled, rejected) de la requête asynchrone fetchClientTimers.
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
      // === Fin : Reducers pour récupérer les timers des clients ===

      // === Début : Reducers pour récupérer les timers des tâches ===
      // Explication simple : Ces actions gèrent quand tu demandes à voir tous les chronomètres des tâches - comme la section précédente mais pour les tâches au lieu des clients.
      // Explication technique : Ensemble de reducers similaires au groupe précédent mais pour les timers de tâches, maintenant l'état loading et error global cohérent.
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
      // === Fin : Reducers pour récupérer les timers des tâches ===

      // === Début : Reducers pour récupérer le timer actif ===
      // Explication simple : Ces actions gèrent quand tu demandes à voir quel chronomètre est en marche actuellement - pour savoir si tu es en train de chronométrer quelque chose.
      // Explication technique : Groupe final de reducers qui gèrent la requête de recherche d'un timer actuellement en cours d'exécution à travers l'application.
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
      // === Fin : Reducers pour récupérer le timer actif ===
  }
});
// === Fin : Création du slice des timers ===

// === Début : Exportation des actions ===
// Explication simple : Ces lignes rendent les actions disponibles pour que d'autres parties de l'application puissent les utiliser, comme une liste de commandes que tout le monde peut utiliser.
// Explication technique : Destructuration et exportation des créateurs d'actions générés automatiquement par createSlice, permettant leur utilisation dans les composants via useDispatch.
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
// === Fin : Exportation des actions ===

// === Début : Définition des thunks pour récupérer les timers ===
// Explication simple : Ces fonctions vont chercher les informations des chronomètres sur le serveur - comme quand tu vas chercher tes jouets dans une autre pièce.
// Explication technique : Thunks qui encapsulent la logique asynchrone pour récupérer les données de timer, gérant le cycle complet de la requête avec dispatch des actions appropriées.
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
// === Fin : Définition des thunks pour récupérer les timers ===

// === Début : Fonctions utilitaires pour contrôler les timers ===
// Explication simple : Ces fonctions sont comme des boutons spéciaux pour faire des actions courantes avec les chronomètres - les cacher, les mettre en pause, les démarrer.
// Explication technique : Collection de thunks utilitaires qui encapsulent les opérations fréquentes sur les timers, simplifiant leur utilisation dans les composants.
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
// === Fin : Fonctions utilitaires pour contrôler les timers ===

export default timerSlice.reducer;
