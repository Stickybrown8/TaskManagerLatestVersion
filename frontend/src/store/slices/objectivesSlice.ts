// === Ce fichier gère les objectifs dans l'application, ce sont les grands buts que tu veux atteindre pour tes clients === /workspaces/TaskManagerLatestVersion/frontend/src/store/slices/objectivesSlice.ts
// Explication simple : Ce fichier est comme un grand tableau qui garde en mémoire tous tes objectifs importants, leurs détails et leur avancement.
// Explication technique : Module Redux Toolkit qui définit un "slice" pour gérer l'état des objectifs, utilisant l'API createSlice avec types TypeScript précis pour la sécurité du typage.
// Utilisé dans : Les composants qui affichent ou modifient des objectifs comme ObjectivesList, ObjectiveDetail, ObjectiveForm, et tous les tableaux de bord qui montrent des objectifs.
// Connecté à : Store Redux principal, actions d'objectifs, service API objectifs, et composants React qui utilisent les données d'objectifs via useSelector/useDispatch.

import { createSlice, PayloadAction, SliceCaseReducers, CaseReducer } from '@reduxjs/toolkit';
import { Dispatch } from 'redux';

// === Début : Définition des types d'objectifs ===
// Explication simple : Ces lignes décrivent à quoi ressemble la fiche d'un objectif, avec son titre, sa description, sa date limite et tout ce que tu dois savoir sur lui.
// Explication technique : Interfaces TypeScript qui définissent la structure des données des objectifs et leur état global, garantissant la sécurité des types à travers l'application.
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
// === Fin : Définition des types d'objectifs ===

// === Début : Configuration de l'état initial ===
// Explication simple : Ces lignes préparent l'état de départ - au début, ta liste d'objectifs est vide, rien n'est sélectionné, et rien ne charge.
// Explication technique : Objet définissant l'état initial du slice des objectifs avec toutes les propriétés à leurs valeurs par défaut, utilisé lors de l'initialisation du store Redux.
// État initial
const initialState: ObjectivesState = {
  objectives: {},
  highImpactObjectives: {},
  currentObjective: null,
  loading: false,
  error: null
};
// === Fin : Configuration de l'état initial ===

// === Début : Création du slice des objectifs avec types avancés ===
// Explication simple : Ce bloc crée une grande boîte magique qui contient toutes les actions possibles pour gérer tes objectifs - les ajouter, les modifier, les supprimer.
// Explication technique : Configuration détaillée du createSlice avec typage explicite pour chaque reducer, garantissant une sécurité maximale des types et une meilleure assistance de l'IDE.
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
    // === Début : Actions pour gérer l'objectif courant ===
    // Explication simple : Ces actions permettent de choisir quel objectif tu veux regarder en détail, comme quand tu pointes du doigt un élément précis dans une liste.
    // Explication technique : Reducers qui contrôlent la sélection et la désélection de l'objectif actuellement consulté ou édité dans l'interface utilisateur.
    // Définir l'objectif courant
    setCurrentObjective: (state, action: PayloadAction<Objective | null>) => {
      state.currentObjective = action.payload;
    },

    // Effacer l'objectif courant
    clearCurrentObjective: (state) => {
      state.currentObjective = null;
    },
    // === Fin : Actions pour gérer l'objectif courant ===

    // === Début : Action pour gérer les erreurs ===
    // Explication simple : Cette action efface les messages d'erreur quand ils ne sont plus nécessaires, comme quand tu effaces un tableau après avoir fini de l'utiliser.
    // Explication technique : Reducer qui réinitialise l'état d'erreur, typiquement appelé après qu'une erreur a été traitée ou affichée à l'utilisateur.
    // Gérer les erreurs
    clearObjectivesError: (state) => {
      state.error = null;
    },
    // === Fin : Action pour gérer les erreurs ===

    // === Début : Action pour ajouter un objectif ===
    // Explication simple : Cette action ajoute un nouvel objectif à ta liste, comme quand tu écris un nouveau but dans ton carnet.
    // Explication technique : Reducer qui insère un nouvel objectif dans la collection, avec logique conditionnelle pour l'ajouter aussi à la collection des objectifs à fort impact si nécessaire.
    // Ajouter un objectif
    addObjective: (state, action: PayloadAction<Objective>) => {
      const objective = action.payload;
      state.objectives[objective._id] = objective;

      if (objective.isHighImpact) {
        state.highImpactObjectives[objective._id] = objective;
      }
    },
    // === Fin : Action pour ajouter un objectif ===

    // === Début : Action pour mettre à jour un objectif ===
    // Explication simple : Cette action change les informations d'un objectif existant, comme quand tu modifies les détails d'un projet dans ton agenda.
    // Explication technique : Reducer complexe qui met à jour un objectif existant, gère sa présence dans la collection highImpact selon son statut, et met à jour l'objectif courant si nécessaire.
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
    // === Fin : Action pour mettre à jour un objectif ===

    // === Début : Action pour supprimer un objectif ===
    // Explication simple : Cette action retire complètement un objectif de ta liste, comme quand tu effaces un but de ton carnet parce qu'il n'est plus important.
    // Explication technique : Reducer qui supprime un objectif des différentes collections de l'état, assurant la cohérence en vérifiant aussi l'objectif courant.
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
    // === Fin : Action pour supprimer un objectif ===

    // === Début : Action pour mettre à jour la progression d'un objectif ===
    // Explication simple : Cette action met à jour l'avancement d'un objectif, comme quand tu colories une barre de progression pour montrer combien tu as déjà fait.
    // Explication technique : Reducer spécialisé qui modifie uniquement la propriété de progression d'un objectif, tout en assurant la cohérence entre les différentes collections d'état.
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
    // === Fin : Action pour mettre à jour la progression d'un objectif ===

    // === Début : Action pour marquer un objectif comme prioritaire ===
    // Explication simple : Cette action marque un objectif comme très important, comme quand tu entoures un devoir urgent en rouge dans ton agenda.
    // Explication technique : Reducer qui définit un objectif comme ayant un fort impact et l'ajoute à la collection spéciale highImpactObjectives pour un accès rapide.
    // Définir un objectif comme étant à fort impact
    setHighImpactObjective: (state, action: PayloadAction<string>) => {
      const objectiveId = action.payload;

      if (state.objectives[objectiveId]) {
        state.objectives[objectiveId].isHighImpact = true;
        state.highImpactObjectives[objectiveId] = state.objectives[objectiveId];
      }
    },
    // === Fin : Action pour marquer un objectif comme prioritaire ===

    // === Début : Actions pour gérer le chargement asynchrone des objectifs ===
    // Explication simple : Ces actions gèrent quand tu demandes à voir tous tes objectifs - elles disent "je cherche", puis "voici la liste" ou "je n'ai pas pu les trouver".
    // Explication technique : Ensemble de reducers qui suivent les trois états d'une requête asynchrone (pending, fulfilled, rejected) pour la récupération des objectifs et des objectifs à fort impact.
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
    // === Fin : Actions pour gérer le chargement asynchrone des objectifs ===
  }
});
// === Fin : Création du slice des objectifs avec types avancés ===

// === Début : Exportation des actions ===
// Explication simple : Ces lignes rendent les actions disponibles pour que d'autres parties de l'application puissent les utiliser.
// Explication technique : Destructuration et exportation des créateurs d'actions générés automatiquement par createSlice, permettant leur utilisation dans les composants via useDispatch.
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
// === Fin : Exportation des actions ===

// === Début : Exportation du reducer ===
// Explication simple : Cette ligne rend tout le système de gestion des objectifs disponible pour le reste de l'application.
// Explication technique : Exportation par défaut du reducer généré par createSlice, qui sera combiné avec d'autres reducers dans le store Redux principal.
// Export du reducer
export default objectivesSlice.reducer;
// === Fin : Exportation du reducer ===

// === Début : Définition des thunks pour les opérations asynchrones ===
// Explication simple : Ces fonctions sont comme des assistants spéciaux qui vont chercher tes objectifs sur le serveur et les ramènent dans ton application.
// Explication technique : Fonctions thunk qui encapsulent la logique asynchrone pour récupérer les données d'objectifs, gérant le cycle de vie complet de la requête avec gestion des erreurs.
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
// === Fin : Définition des thunks pour les opérations asynchrones ===
