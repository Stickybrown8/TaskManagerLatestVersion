// === Ce fichier gère les chronomètres qui suivent le temps passé sur les tâches === /workspaces/TaskManagerLatestVersion/frontend/src/services/timerService.js
// Explication simple : Ce fichier contient des fonctions qui t'aident à mesurer le temps que tu passes sur chaque tâche, comme un chronomètre que tu peux démarrer, arrêter, et consulter plus tard.
// Explication technique : Module de service JavaScript qui encapsule les appels API liés à la gestion des chronomètres (timers), permettant le suivi du temps passé sur les tâches et clients.
// Utilisé dans : Les composants de suivi du temps comme TimerWidget, TaskDetail, les tableaux de bord de productivité, et les rapports de facturation.
// Connecté à : API backend via Axios, service d'authentification (authHeader), et composants React qui intègrent les fonctionnalités de chronométrage.

import axios from 'axios';
import { getAuthHeader } from './authHeader';

// === Début : Configuration de l'URL de l'API ===
// Explication simple : C'est l'adresse où l'application va chercher et envoyer les informations sur les chronomètres, comme l'adresse de l'horloge centrale qui garde tous les temps.
// Explication technique : Constante qui définit l'URL de base pour les requêtes API, récupérée depuis les variables d'environnement ou utilisant une valeur par défaut pour le développement local.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// === Fin : Configuration de l'URL de l'API ===

// === Début : Définition du service de gestion des chronomètres ===
// Explication simple : C'est comme une boîte à outils spéciale qui contient tous les outils pour gérer tes chronomètres - les démarrer, les arrêter, les consulter.
// Explication technique : Objet exporté qui encapsule une collection de méthodes asynchrones pour interagir avec les endpoints de l'API liés aux chronomètres, suivant le pattern Service.
// Service pour la gestion des chronomètres
export const timerService = {
  // === Début : Fonction pour récupérer tous les chronomètres ===
  // Explication simple : Cette fonction va chercher la liste de tous les chronomètres que tu as utilisés, comme si tu demandais à voir toutes tes montres.
  // Explication technique : Méthode asynchrone qui effectue une requête GET à l'API pour récupérer l'ensemble des enregistrements de temps (timers) de l'utilisateur.
  // Récupérer tous les chronomètres
  getAllTimers: async () => {
    const response = await axios.get(`${API_URL}/timers`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour récupérer tous les chronomètres ===
  
  // === Début : Fonction pour récupérer le chronomètre actif ===
  // Explication simple : Cette fonction cherche s'il y a un chronomètre qui est en train de tourner en ce moment, comme quand tu cherches quelle minuterie est active.
  // Explication technique : Méthode asynchrone qui interroge l'API pour obtenir le timer actuellement en cours d'exécution (non terminé), s'il en existe un.
  // Récupérer le chronomètre en cours d'exécution
  getRunningTimer: async () => {
    const response = await axios.get(`${API_URL}/timers/running`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour récupérer le chronomètre actif ===
  
  // === Début : Fonction pour récupérer un chronomètre spécifique ===
  // Explication simple : Cette fonction va chercher les détails d'un seul chronomètre précis, comme si tu voulais voir les informations d'une minuterie particulière.
  // Explication technique : Méthode asynchrone qui effectue une requête GET pour récupérer les données d'un timer spécifique identifié par son ID unique.
  // Récupérer un chronomètre par son ID
  getTimerById: async (id) => {
    const response = await axios.get(`${API_URL}/timers/${id}`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour récupérer un chronomètre spécifique ===
  
  // === Début : Fonction pour démarrer un chronomètre ===
  // Explication simple : Cette fonction démarre un nouveau chronomètre, comme quand tu appuies sur "start" pour commencer à mesurer le temps.
  // Explication technique : Méthode asynchrone qui effectue une requête POST pour créer un nouveau timer dans la base de données avec les informations fournies et une heure de début.
  // Démarrer un nouveau chronomètre
  startTimer: async (timerData) => {
    const response = await axios.post(`${API_URL}/timers`, timerData, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour démarrer un chronomètre ===
  
  // === Début : Fonction pour mettre en pause un chronomètre ===
  // Explication simple : Cette fonction met un chronomètre en pause, comme quand tu appuies sur "pause" pour arrêter temporairement de compter le temps.
  // Explication technique : Méthode asynchrone qui envoie une requête PUT pour suspendre temporairement un timer en cours sans le terminer définitivement.
  // Mettre en pause un chronomètre
  pauseTimer: async (id) => {
    const response = await axios.put(`${API_URL}/timers/${id}/pause`, {}, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour mettre en pause un chronomètre ===
  
  // === Début : Fonction pour reprendre un chronomètre ===
  // Explication simple : Cette fonction redémarre un chronomètre qui était en pause, comme quand tu appuies sur "play" après avoir mis en pause.
  // Explication technique : Méthode asynchrone qui effectue une requête PUT pour reprendre le comptage d'un timer précédemment mis en pause.
  // Reprendre un chronomètre en pause
  resumeTimer: async (id) => {
    const response = await axios.put(`${API_URL}/timers/${id}/resume`, {}, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour reprendre un chronomètre ===
  
  // === Début : Fonction pour arrêter un chronomètre ===
  // Explication simple : Cette fonction arrête complètement un chronomètre, comme quand tu appuies sur "stop" pour terminer de mesurer le temps.
  // Explication technique : Méthode asynchrone qui envoie une requête PUT pour finaliser un timer en cours, en enregistrant l'heure de fin et en calculant la durée totale.
  // Arrêter un chronomètre
  stopTimer: async (id) => {
    const response = await axios.put(`${API_URL}/timers/${id}/stop`, {}, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour arrêter un chronomètre ===
  
  // === Début : Fonction pour supprimer un chronomètre ===
  // Explication simple : Cette fonction efface un chronomètre de la liste, comme si tu jetais une minuterie dont tu n'as plus besoin.
  // Explication technique : Méthode asynchrone qui effectue une requête DELETE à l'API pour supprimer définitivement un enregistrement de temps de la base de données.
  // Supprimer un chronomètre
  deleteTimer: async (id) => {
    const response = await axios.delete(`${API_URL}/timers/${id}`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour supprimer un chronomètre ===
  
  // === Début : Fonction pour récupérer les chronomètres d'un client ===
  // Explication simple : Cette fonction trouve tous les chronomètres utilisés pour un client particulier, comme si tu cherchais le temps passé à travailler pour une personne précise.
  // Explication technique : Méthode asynchrone qui interroge l'API pour obtenir tous les timers associés à un client spécifique identifié par son ID.
  // Récupérer les chronomètres d'un client spécifique
  getClientTimers: async (clientId) => {
    const response = await axios.get(`${API_URL}/timers/client/${clientId}`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour récupérer les chronomètres d'un client ===
  
  // === Début : Fonction pour récupérer les chronomètres d'une tâche ===
  // Explication simple : Cette fonction trouve tous les chronomètres utilisés pour une tâche particulière, comme si tu cherchais combien de temps tu as passé sur un devoir spécifique.
  // Explication technique : Méthode asynchrone qui effectue une requête GET pour récupérer tous les enregistrements de temps associés à une tâche spécifique identifiée par son ID.
  // Récupérer les chronomètres d'une tâche spécifique
  getTaskTimers: async (taskId) => {
    const response = await axios.get(`${API_URL}/timers/task/${taskId}`, { headers: getAuthHeader() });
    return response.data;
  }
  // === Fin : Fonction pour récupérer les chronomètres d'une tâche ===
};
// === Fin : Définition du service de gestion des chronomètres ===
