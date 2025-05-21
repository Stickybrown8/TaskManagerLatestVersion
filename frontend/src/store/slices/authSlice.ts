// === Ce fichier gère tout ce qui concerne la connexion et le compte utilisateur === /workspaces/TaskManagerLatestVersion/frontend/src/store/slices/authSlice.ts
// Explication simple : Ce fichier est comme le gardien de l'application qui vérifie si tu as le droit d'entrer, garde en mémoire qui tu es, et te donne un badge (token) qui prouve que tu es bien connecté.
// Explication technique : Module Redux Toolkit qui définit un "slice" pour gérer l'état d'authentification, utilisant l'API createSlice pour encapsuler la logique de réduction des actions liées à l'authentification.
// Utilisé dans : Les composants d'authentification (Login, Register), la barre de navigation, et tout composant qui a besoin de vérifier si l'utilisateur est connecté ou d'accéder à ses informations.
// Connecté à : Store Redux principal, actions d'authentification, composants React via useSelector/useDispatch, et localStorage pour la persistance des données de session.

// frontend/src/store/slices/authSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/User'; // On utilise le type global User

// === Début : Définition des types pour l'authentification ===
// Explication simple : Ces lignes décrivent à quoi ressemblent les informations d'un utilisateur connecté - comme une fiche d'identité avec ton nom, ton statut de connexion, etc.
// Explication technique : Interfaces TypeScript qui définissent la structure de l'état d'authentification et les types de données attendus pour les actions de connexion, assurant la sécurité des types.
// Types
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  rehydrated: boolean;
}

interface LoginPayload {
  user: User;
  token: string;
}
// === Fin : Définition des types pour l'authentification ===

// === Début : Configuration de l'état initial ===
// Explication simple : Ces lignes préparent l'état de départ - au début, personne n'est connecté, il n'y a pas d'utilisateur, pas de badge (token), et rien ne charge.
// Explication technique : Objet définissant l'état initial du slice d'authentification avec toutes les propriétés à leurs valeurs par défaut, utilisé lors de l'initialisation du store Redux.
// État initial
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
  rehydrated: false,
};
// === Fin : Configuration de l'état initial ===

// === Début : Création du slice d'authentification ===
// Explication simple : Ce morceau crée une boîte magique qui contient toutes les actions possibles pour la connexion - se connecter, se déconnecter, et mettre à jour ton profil.
// Explication technique : Utilisation de createSlice de Redux Toolkit pour définir un ensemble de reducers qui modifient l'état d'authentification en réponse à diverses actions, avec immuabilité gérée automatiquement.
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // === Début : Action de démarrage de connexion ===
    // Explication simple : Quand tu commences à te connecter, cette action dit "je suis en train de me connecter" et efface les erreurs précédentes.
    // Explication technique : Reducer qui met l'état loading à true et réinitialise les erreurs, indiquant le début d'une opération d'authentification asynchrone.
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    // === Fin : Action de démarrage de connexion ===
    
    // === Début : Action de connexion réussie ===
    // Explication simple : Quand la connexion a fonctionné, cette action enregistre qui tu es, te donne un badge spécial (token), et sauvegarde ces informations pour que tu restes connecté.
    // Explication technique : Reducer qui met à jour l'état avec les données de l'utilisateur connecté et le token JWT, tout en les persistant dans le localStorage pour maintenir la session.
    loginSuccess: (state, action: PayloadAction<LoginPayload>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
      state.rehydrated = true;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    // === Fin : Action de connexion réussie ===
    
    // === Début : Action d'échec de connexion ===
    // Explication simple : Si la connexion échoue, cette action note le problème et te dit que tu n'es pas connecté.
    // Explication technique : Reducer qui gère l'échec d'authentification en réinitialisant l'état et en stockant le message d'erreur pour l'affichage à l'utilisateur.
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = action.payload;
      state.rehydrated = true;
    },
    // === Fin : Action d'échec de connexion ===
    
    // === Début : Action de déconnexion ===
    // Explication simple : Quand tu te déconnectes, cette action efface toutes tes informations et ton badge pour que personne ne puisse les utiliser.
    // Explication technique : Reducer qui réinitialise l'état d'authentification et supprime les données persistantes du localStorage, terminant complètement la session utilisateur.
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      state.rehydrated = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    // === Fin : Action de déconnexion ===
    
    // === Début : Action de mise à jour du profil ===
    // Explication simple : Quand tu changes des infos de ton profil, cette action met à jour ta fiche sans avoir à te reconnecter.
    // Explication technique : Reducer qui permet des modifications partielles des données utilisateur, utilisant la syntaxe de spread pour une mise à jour immutable.
    updateUserProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    // === Fin : Action de mise à jour du profil ===
    
    // === Début : Action de mise à jour des données de gamification ===
    // Explication simple : Quand tu gagnes des points ou des badges, cette action met à jour juste la partie "jeu" de ton profil.
    // Explication technique : Reducer spécialisé qui cible uniquement la section gamification du profil utilisateur, permettant des mises à jour granulaires sans affecter le reste du profil.
    updateUserGamification: (state, action: PayloadAction<Partial<User['gamification']>>) => {
      if (state.user && state.user.gamification) {
        state.user.gamification = { ...state.user.gamification, ...action.payload };
      }
    },
    // === Fin : Action de mise à jour des données de gamification ===
    
    // === Début : Action de confirmation de chargement ===
    // Explication simple : Cette action indique que l'application a vérifié si tu étais déjà connecté quand tu l'as ouverte.
    // Explication technique : Reducer qui marque l'état comme "rehydraté", signalant que la récupération initiale des données d'authentification depuis localStorage est terminée.
    setRehydrated: (state) => {
      state.rehydrated = true;
    }
    // === Fin : Action de confirmation de chargement ===
  },
});
// === Fin : Création du slice d'authentification ===

// === Début : Exportation des actions ===
// Explication simple : Ces lignes rendent les actions disponibles pour que d'autres parties de l'application puissent les utiliser.
// Explication technique : Destructuration et exportation des créateurs d'actions générés automatiquement par createSlice, permettant leur utilisation dans les composants via useDispatch.
// Actions
export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUserProfile,
  updateUserGamification,
  setRehydrated,
} = authSlice.actions;
// === Fin : Exportation des actions ===

// === Début : Exportation du reducer ===
// Explication simple : Cette ligne rend tout le système d'authentification disponible pour le reste de l'application.
// Explication technique : Exportation par défaut du reducer généré par createSlice, qui sera combiné avec d'autres reducers dans le store Redux principal.
// Reducer
export default authSlice.reducer;
// === Fin : Exportation du reducer ===