// === Ce fichier contient toutes les fonctions qui permettent de communiquer avec le serveur pour gérer les objectifs des clients === /workspaces/TaskManagerLatestVersion/frontend/src/services/objectivesService.js
// Explication simple : C'est comme un carnet de numéros de téléphone spécial qui indique à l'application comment demander au serveur de créer, voir, modifier ou supprimer des objectifs pour tes clients.
// Explication technique : Module de service JavaScript qui encapsule toutes les requêtes API liées aux objectifs clients, organisant les opérations CRUD en méthodes spécifiques.
// Utilisé dans : Les pages et composants qui manipulent des objectifs clients, comme ClientDetail, ObjectiveForm, ObjectivesList, Dashboard, etc.
// Connecté à : API backend via Axios, service d'authentification (authHeader), et composants React qui gèrent les objectifs.

import axios from 'axios';
import { getAuthHeader } from './authHeader';

// === Début : Configuration de l'URL de l'API ===
// Explication simple : C'est l'adresse où ton application va chercher les informations, comme une adresse postale pour envoyer et recevoir du courrier.
// Explication technique : Constante qui définit l'URL de base de l'API, récupérée depuis les variables d'environnement ou utilisant une valeur par défaut pour le développement local.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// === Fin : Configuration de l'URL de l'API ===

// === Début : Définition du service d'objectifs ===
// Explication simple : C'est comme une boîte à outils qui contient tous les outils dont tu as besoin pour travailler avec les objectifs des clients.
// Explication technique : Objet qui encapsule une collection de méthodes asynchrones pour interagir avec les endpoints de l'API liés aux objectifs, suivant le pattern Service pour une organisation modulaire du code.
// Service pour les objectifs clients
export const objectivesService = {
  // === Début : Fonction pour récupérer tous les objectifs ===
  // Explication simple : Cette fonction va chercher la liste de tous les objectifs, comme si tu demandais à voir tous les livres d'une bibliothèque.
  // Explication technique : Méthode asynchrone qui effectue une requête GET à l'endpoint correspondant de l'API, incluant les en-têtes d'authentification pour l'accès sécurisé.
  // Récupérer tous les objectifs
  getAll: async () => {
    const response = await axios.get(`${API_URL}/objectives`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour récupérer tous les objectifs ===
  
  // === Début : Fonction pour récupérer un objectif spécifique ===
  // Explication simple : Cette fonction va chercher les détails d'un seul objectif précis, comme si tu demandais des informations sur un livre particulier en donnant son numéro.
  // Explication technique : Méthode asynchrone qui effectue une requête GET à l'endpoint d'un objectif spécifique identifié par son ID unique, avec authentification.
  // Récupérer un objectif par son ID
  getById: async (id) => {
    const response = await axios.get(`${API_URL}/objectives/${id}`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour récupérer un objectif spécifique ===
  
  // === Début : Fonction pour récupérer les objectifs d'un client ===
  // Explication simple : Cette fonction trouve tous les objectifs qui appartiennent à un client particulier, comme si tu cherchais tous les devoirs d'un élève spécifique.
  // Explication technique : Méthode asynchrone qui interroge l'API pour obtenir tous les objectifs associés à un client spécifique identifié par son ID.
  // Récupérer les objectifs d'un client spécifique
  getByClient: async (clientId) => {
    const response = await axios.get(`${API_URL}/objectives/client/${clientId}`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour récupérer les objectifs d'un client ===
  
  // === Début : Fonction pour récupérer les objectifs à fort impact ===
  // Explication simple : Cette fonction trouve les objectifs les plus importants qui vont apporter les meilleurs résultats, comme chercher les exercices qui te feront avoir les meilleures notes.
  // Explication technique : Méthode qui récupère les objectifs marqués comme "high-impact" selon le principe de Pareto (80/20), permettant de se concentrer sur les actions à fort retour sur investissement.
  // Récupérer les objectifs à fort impact (80/20)
  getHighImpact: async () => {
    const response = await axios.get(`${API_URL}/objectives/high-impact`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour récupérer les objectifs à fort impact ===
  
  // === Début : Fonction pour créer un objectif ===
  // Explication simple : Cette fonction ajoute un nouvel objectif dans la liste, comme quand tu ajoutes un nouveau livre à ta bibliothèque.
  // Explication technique : Méthode qui effectue une requête POST à l'API pour créer une nouvelle ressource d'objectif avec les données fournies, en incluant les en-têtes d'authentification.
  // Créer un nouvel objectif
  create: async (objectiveData) => {
    const response = await axios.post(`${API_URL}/objectives`, objectiveData, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour créer un objectif ===
  
  // === Début : Fonction pour mettre à jour un objectif ===
  // Explication simple : Cette fonction change les informations d'un objectif existant, comme quand tu mets à jour les détails d'un événement dans ton agenda.
  // Explication technique : Méthode asynchrone qui effectue une requête PUT pour modifier une ressource existante identifiée par son ID avec les nouvelles données fournies.
  // Mettre à jour un objectif
  update: async (id, objectiveData) => {
    const response = await axios.put(`${API_URL}/objectives/${id}`, objectiveData, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour mettre à jour un objectif ===
  
  // === Début : Fonction pour mettre à jour la progression d'un objectif ===
  // Explication simple : Cette fonction met à jour l'avancement d'un objectif, comme quand tu notes combien de pages d'un livre tu as déjà lues.
  // Explication technique : Méthode spécifique qui actualise uniquement la valeur de progression d'un objectif via un endpoint dédié, permettant un suivi granulaire sans modifier les autres propriétés.
  // Mettre à jour la progression d'un objectif
  updateProgress: async (id, currentValue) => {
    const response = await axios.put(`${API_URL}/objectives/${id}/progress`, { currentValue }, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour mettre à jour la progression d'un objectif ===
  
  // === Début : Fonction pour supprimer un objectif ===
  // Explication simple : Cette fonction efface un objectif de la liste, comme quand tu retires un livre de ta bibliothèque.
  // Explication technique : Méthode qui effectue une requête DELETE à l'API pour supprimer définitivement une ressource d'objectif spécifiée par son ID.
  // Supprimer un objectif
  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/objectives/${id}`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour supprimer un objectif ===
  
  // === Début : Fonction pour associer une tâche à un objectif ===
  // Explication simple : Cette fonction relie une tâche à un objectif, comme quand tu indiques qu'un devoir spécifique fait partie d'un projet plus grand.
  // Explication technique : Méthode qui crée une relation entre une tâche et un objectif via une requête POST, établissant une association dans la base de données pour le suivi et l'analyse.
  // Lier une tâche à un objectif
  linkTask: async (objectiveId, taskId) => {
    const response = await axios.post(`${API_URL}/objectives/${objectiveId}/link-task/${taskId}`, {}, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour associer une tâche à un objectif ===
  
  // === Début : Fonction pour dissocier une tâche d'un objectif ===
  // Explication simple : Cette fonction enlève le lien entre une tâche et un objectif, comme quand tu décides qu'un devoir ne fait plus partie d'un projet.
  // Explication technique : Méthode qui supprime la relation entre une tâche et un objectif via une requête DELETE, permettant de réorganiser les associations dans le système.
  // Délier une tâche d'un objectif
  unlinkTask: async (objectiveId, taskId) => {
    const response = await axios.delete(`${API_URL}/objectives/${objectiveId}/unlink-task/${taskId}`, { headers: getAuthHeader() });
    return response.data;
  }
  // === Fin : Fonction pour dissocier une tâche d'un objectif ===
};
// === Fin : Définition du service d'objectifs ===
