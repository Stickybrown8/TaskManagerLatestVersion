// === Ce fichier est le centre de contrôle qui gère toutes les données de l'application === /workspaces/TaskManagerLatestVersion/frontend/src/store/index.ts
// Explication simple : Ce fichier est comme le cerveau de l'application qui stocke et organise toutes les informations - tes tâches, clients, minuteurs et paramètres - pour que tous les écrans puissent y accéder facilement.
// Explication technique : Configuration centrale du store Redux avec Redux Toolkit, regroupant tous les reducers des différents slices et définissant le middleware personnalisé et les types TypeScript globaux.
// Utilisé dans : Le composant racine de l'application (App.tsx ou _app.tsx) pour fournir l'état global à tous les composants via Provider.
// Connecté à : Tous les slices Redux (auth, ui, tasks, etc.), hooks personnalisés, et indirectement à tous les composants qui utilisent des données via useSelector/useDispatch.

import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import tasksReducer from './slices/tasksSlice';
import clientsReducer from './slices/clientsSlice';
import gamificationReducer from './slices/gamificationSlice';
import timerReducer from './slices/timerSlice';
import taskImpactReducer from './slices/taskImpactSlice';
import profitabilityReducer from './slices/profitabilitySlice';
import objectivesReducer from './slices/objectivesSlice';

// === Début : Importation des types pour le middleware ===
// Explication simple : Ces lignes importent des outils spéciaux pour s'assurer que le code fonctionne correctement, comme quand tu prends les bons ustensiles avant de cuisiner.
// Explication technique : Importation des types TypeScript nécessaires de Redux Toolkit pour typer correctement le middleware personnalisé, assurant une meilleure sécurité de type.
// Importations nécessaires pour le typage du middleware
import { Middleware, MiddlewareAPI, Dispatch, AnyAction } from '@reduxjs/toolkit';
// === Fin : Importation des types pour le middleware ===

// === Début : Définition du middleware de surveillance des timers ===
// Explication simple : Ce petit programme surveille toutes les actions liées aux chronomètres et affiche des messages dans la console pour aider les développeurs à comprendre ce qui se passe.
// Explication technique : Middleware Redux typé qui intercepte toutes les actions liées au timer, journalise l'action et l'état avant/après dans la console, facilitant le débogage des opérations de timer.
// Ajout des types explicites au middleware
const timerActionMiddleware: Middleware = 
  (store: MiddlewareAPI) => 
  (next: Dispatch) => 
  (action: AnyAction) => {
    if (action.type.startsWith('timer/')) {
      console.log('⚡ Action timer détectée:', action);
      console.log('📊 État avant:', store.getState().timer);
      const result = next(action);
      console.log('📊 État après:', store.getState().timer);
      return result;
    }
    return next(action);
  };
// === Fin : Définition du middleware de surveillance des timers ===

// === Début : Configuration du store Redux central ===
// Explication simple : Ce bloc crée le grand cerveau qui va retenir toutes les informations de l'application, comme une énorme bibliothèque bien organisée avec différentes sections.
// Explication technique : Configuration du store Redux global avec configureStore, combinant tous les reducers des différents domaines fonctionnels et ajoutant le middleware personnalisé à la chaîne de middlewares par défaut.
// Définir le store Redux
export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    tasks: tasksReducer,
    clients: clientsReducer,
    gamification: gamificationReducer,
    timer: timerReducer,
    taskImpact: taskImpactReducer,
    profitability: profitabilityReducer,
    objectives: objectivesReducer
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(timerActionMiddleware)
});
// === Fin : Configuration du store Redux central ===

// === Début : Fonction de réinitialisation du store ===
// Explication simple : Cette fonction est comme un grand bouton "Recommencer" qui remet toutes les informations à zéro quand quelque chose ne va pas.
// Explication technique : Utilitaire qui dispatch une action spéciale pour réinitialiser l'état complet du store, utile pour les tests ou lors de déconnexions utilisateur, avec journalisation dans la console.
// Après la définition du store, ajoutez:
// Force une réinitialisation du store pour s'assurer que tous les slices sont correctement instanciés
export function resetStore() {
  store.dispatch({ type: 'RESET_STORE' });
  console.log("Store réinitialisé", store.getState());
}
// === Fin : Fonction de réinitialisation du store ===

// === Début : Exportation des types TypeScript pour le store ===
// Explication simple : Ces lignes créent des étiquettes spéciales qui aident l'ordinateur à comprendre quelles informations sont stockées et comment les utiliser correctement.
// Explication technique : Définition et exportation des types TypeScript dérivés du store pour permettre un typage fort lors de l'utilisation de useSelector et useDispatch dans les composants.
// Export des types pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
// === Fin : Exportation des types TypeScript pour le store ===

// === Début : Définition des interfaces d'état explicites ===
// Explication simple : Ces blocs décrivent en détail à quoi ressemblent les différentes parties des informations stockées, comme une fiche qui explique le contenu de chaque tiroir.
// Explication technique : Définition manuelle d'interfaces TypeScript pour chaque slice, offrant une alternative aux types inférés automatiquement, facilitant la documentation et la référence dans les composants.
// Définir des types explicites pour les états des slices
export interface AuthState {
  user?: {
    name?: string;
    email?: string;
    profile?: {
      avatar?: string;
    };
  } | null;
  isAuthenticated?: boolean;
  token?: string | null;
  loading?: boolean;
  error?: string | null;
}

export interface GamificationState {
  level?: number;
  experience?: number;
  actionPoints?: number;
  badges?: any[];
}

export interface UIState {
  darkMode?: boolean;
  sidebarOpen?: boolean;
}
// === Fin : Définition des interfaces d'état explicites ===
