// === Ce fichier gère toutes les informations des clients dans l'application === /workspaces/TaskManagerLatestVersion/frontend/src/store/slices/clientsSlice.ts
// Explication simple : Ce fichier est comme un grand carnet d'adresses qui garde en mémoire tous tes clients, leurs contacts et ce que tu fais pour eux.
// Explication technique : Module Redux Toolkit qui définit un "slice" pour gérer l'état des clients, utilisant l'API createSlice pour encapsuler la logique de réduction des actions liées aux clients.
// Utilisé dans : Les composants qui affichent ou modifient des clients comme ClientList, ClientDetail, ClientForm, et tous les composants qui ont besoin d'accéder aux données clients.
// Connecté à : Store Redux principal, actions clientes (clientActions), composants React via useSelector/useDispatch, et indirectement à l'API des clients via les thunks.

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// === Début : Définition des types de clients ===
// Explication simple : Ces lignes décrivent à quoi ressemble la fiche d'un client, avec son nom, sa description, et toutes les informations importantes à son sujet.
// Explication technique : Interfaces TypeScript qui définissent le modèle de données Client et ses propriétés, établissant un contrat type pour garantir la cohérence des données dans toute l'application.
// Types
interface Client {
  _id: string;
  name: string;
  description: string;
  status: 'actif' | 'inactif' | 'archivé';
  contacts: Contact[];
  notes: string;
  tags: string[];
  logo?: string; // Ajout de la propriété logo test
  metrics: {
    tasksCompleted: number;
    tasksInProgress: number;
    tasksPending: number;
    lastActivity: string;
  };
}

interface Contact {
  name: string;
  role: string;
  email: string;
  phone: string;
  isMain: boolean;
}

interface ClientsState {
  clients: Client[];
  currentClient: Client | null;
  loading: boolean;
  error: string | null;
}
// === Fin : Définition des types de clients ===

// === Début : Configuration de l'état initial ===
// Explication simple : Ces lignes préparent l'état de départ - au début, ta liste de clients est vide, rien n'est sélectionné, et rien ne charge.
// Explication technique : Objet définissant l'état initial du slice des clients avec toutes les propriétés à leurs valeurs par défaut, utilisé lors de l'initialisation du store Redux.
// État initial
const initialState: ClientsState = {
  clients: [],
  currentClient: null,
  loading: false,
  error: null,
};
// === Fin : Configuration de l'état initial ===

// === Début : Création du slice des clients ===
// Explication simple : Ce bloc crée une grande boîte magique qui contient toutes les actions possibles pour gérer tes clients - les récupérer, en ajouter, les modifier, ou les supprimer.
// Explication technique : Utilisation de createSlice de Redux Toolkit pour définir un ensemble de reducers qui modifient l'état des clients en réponse à diverses actions, avec immuabilité gérée automatiquement.
// Slice
const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    // === Début : Actions pour récupérer tous les clients ===
    // Explication simple : Ces actions gèrent quand tu demandes à voir tous tes clients - elles disent "je cherche", puis "voici la liste" ou "oups, il y a eu un problème".
    // Explication technique : Trio de reducers qui gèrent le cycle de vie d'une requête asynchrone pour récupérer la liste des clients, avec états de chargement, succès et erreur.
    fetchClientsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchClientsSuccess: (state, action: PayloadAction<Client[]>) => {
      console.log("→ Reducer fetchClientsSuccess appelé avec :", action.payload); // <-- AJOUT DU LOG
      state.clients = action.payload;
      state.loading = false;
    },
    fetchClientsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour récupérer tous les clients ===
    
    // === Début : Actions pour récupérer un client spécifique ===
    // Explication simple : Ces actions gèrent quand tu demandes à voir un seul client en détail - elles disent "je cherche ce client particulier", puis montrent les détails ou signalent un problème.
    // Explication technique : Ensemble de reducers qui contrôlent le flux d'une requête pour un client unique, identifié par son ID, modifiant l'état currentClient en conséquence.
    fetchClientStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchClientSuccess: (state, action: PayloadAction<Client>) => {
      state.currentClient = action.payload;
      state.loading = false;
    },
    fetchClientFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour récupérer un client spécifique ===
    
    // === Début : Actions pour créer un nouveau client ===
    // Explication simple : Ces actions gèrent quand tu veux ajouter un nouveau client à ta liste - elles disent "je crée", puis "c'est fait" ou "ça n'a pas marché".
    // Explication technique : Séquence de reducers qui orchestrent la création d'un nouveau client, avec ajout de l'objet client à l'array clients en cas de succès.
    createClientStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    createClientSuccess: (state, action: PayloadAction<Client>) => {
      state.clients.push(action.payload);
      state.loading = false;
    },
    createClientFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour créer un nouveau client ===
    
    // === Début : Actions pour mettre à jour un client ===
    // Explication simple : Ces actions gèrent quand tu modifies les informations d'un client - elles disent "je change des infos", puis "j'ai mis à jour" ou "je n'ai pas pu changer ça".
    // Explication technique : Groupe de reducers qui gèrent la mise à jour d'un client existant, avec recherche par ID et modification immutable de l'objet correspondant dans l'array clients.
    updateClientStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateClientSuccess: (state, action: PayloadAction<Client>) => {
      const index = state.clients.findIndex(client => client._id === action.payload._id);
      if (index !== -1) {
        state.clients[index] = action.payload;
      }
      if (state.currentClient && state.currentClient._id === action.payload._id) {
        state.currentClient = action.payload;
      }
      state.loading = false;
    },
    updateClientFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour mettre à jour un client ===
    
    // === Début : Actions pour supprimer un client ===
    // Explication simple : Ces actions gèrent quand tu veux retirer un client de ta liste - elles disent "je supprime", puis "c'est effacé" ou "je n'ai pas pu supprimer".
    // Explication technique : Ensemble de reducers qui gèrent la suppression d'un client via son ID, avec filtrage immutable du tableau clients pour retirer l'élément correspondant.
    deleteClientStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteClientSuccess: (state, action: PayloadAction<string>) => {
      state.clients = state.clients.filter(client => client._id !== action.payload);
      if (state.currentClient && state.currentClient._id === action.payload) {
        state.currentClient = null;
      }
      state.loading = false;
    },
    deleteClientFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour supprimer un client ===
    
    // === Début : Action pour effacer le client sélectionné ===
    // Explication simple : Cette action efface le client que tu es en train de regarder en détail, comme quand tu fermes la fiche d'un contact.
    // Explication technique : Reducer simple qui réinitialise la propriété currentClient à null, typiquement utilisé lors de la navigation ou du nettoyage de l'interface.
    clearCurrentClient: (state) => {
      state.currentClient = null;
    },
    // === Fin : Action pour effacer le client sélectionné ===
  },
});
// === Fin : Création du slice des clients ===

// === Début : Exportation des actions ===
// Explication simple : Ces lignes rendent les actions disponibles pour que d'autres parties de l'application puissent les utiliser, comme une liste de commandes que tout le monde peut utiliser.
// Explication technique : Destructuration et exportation des créateurs d'actions générés automatiquement par createSlice, permettant leur utilisation dans les composants via useDispatch.
// Actions
export const {
  fetchClientsStart,
  fetchClientsSuccess,
  fetchClientsFailure,
  fetchClientStart,
  fetchClientSuccess,
  fetchClientFailure,
  createClientStart,
  createClientSuccess,
  createClientFailure,
  updateClientStart,
  updateClientSuccess,
  updateClientFailure,
  deleteClientStart,
  deleteClientSuccess,
  deleteClientFailure,
  clearCurrentClient,
} = clientsSlice.actions;
// === Fin : Exportation des actions ===

// === Début : Exportation du reducer ===
// Explication simple : Cette ligne rend tout le système de gestion des clients disponible pour le reste de l'application.
// Explication technique : Exportation par défaut du reducer généré par createSlice, qui sera combiné avec d'autres reducers dans le store Redux principal.
// Reducer
export default clientsSlice.reducer;
// === Fin : Exportation du reducer ===
