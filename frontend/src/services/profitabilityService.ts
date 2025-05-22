// === Ce fichier contient des fonctions pour gérer et calculer combien d'argent tu gagnes avec chaque client === /workspaces/TaskManagerLatestVersion/frontend/src/services/profitabilityService.js
// Explication simple : C'est comme un calculateur qui t'aide à savoir si tu gagnes assez d'argent pour le temps que tu passes à travailler pour chaque client.
// Explication technique : Module de service JavaScript qui encapsule les appels API liés à la gestion de la rentabilité client, incluant tarifs horaires, heures facturables et analyses.
// Utilisé dans : Les pages de tableau de bord financier, détails client, rapports de rentabilité, et composants qui affichent ou modifient les métriques financières.
// Connecté à : API backend via Axios, service d'authentification (authHeader), et composants React qui gèrent ou affichent les données de rentabilité.

import axios from 'axios';
import { getAuthHeader } from './authHeader';

// === Début : Configuration de l'URL de l'API ===
// Types TypeScript pour profitabilityService
interface ProfitabilityData {
  _id: string;
  clientId: string;
  userId: string;
  hourlyRate: number;
  totalHours: number;
  billableHours: number;
  revenue: number;
  cost: number;
  profit: number;
  profitabilityPercentage: number;
  month: number;
  year: number;
}

interface CreateProfitabilityData {
  clientId: string;
  hourlyRate: number;
  totalHours?: number;
  billableHours?: number;
  month?: number;
  year?: number;
}

interface UpdateProfitabilityData extends Partial<CreateProfitabilityData> {
  revenue?: number;
  cost?: number;
}

// Explication simple : C'est l'adresse où l'application va chercher les informations, comme l'adresse d'un magasin où tu vas faire tes courses.
// Explication technique : Constante qui définit l'URL de base de l'API, récupérée depuis les variables d'environnement ou utilisant une valeur par défaut pour le développement local.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// === Fin : Configuration de l'URL de l'API ===

// === Début : Définition du service de rentabilité ===
// Explication simple : C'est comme une boîte à outils spéciale qui contient tous les outils pour calculer et gérer l'argent que tu gagnes avec tes clients.
// Explication technique : Objet exporté qui regroupe toutes les fonctions asynchrones pour interagir avec les points d'API de rentabilité, suivant le pattern Service pour une meilleure organisation du code.
// Service pour la gestion de la rentabilité des clients
export const profitabilityService = {
  // === Début : Fonction pour récupérer toutes les données de rentabilité ===
  // Explication simple : Cette fonction va chercher les informations sur l'argent que tu gagnes avec tous tes clients.
  // Explication technique : Méthode asynchrone qui effectue une requête GET à l'API pour récupérer l'ensemble des données de rentabilité de tous les clients.
  // Récupérer les données de rentabilité pour tous les clients
  getAllProfitability: async (): Promise<ApiResponse<ProfitabilityData[]>> => {
    const response = await axios.get(`${API_URL}/profitability`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour récupérer toutes les données de rentabilité ===
  
  // === Début : Fonction pour récupérer la rentabilité d'un client spécifique ===
  // Explication simple : Cette fonction va chercher les informations sur l'argent que tu gagnes avec un client en particulier.
  // Explication technique : Méthode asynchrone qui interroge l'API pour obtenir les métriques de rentabilité d'un client spécifique identifié par son ID.
  // Récupérer les données de rentabilité pour un client spécifique
  getClientProfitability: async (clientId: string): Promise<ApiResponse<ProfitabilityData>> => {
    const response = await axios.get(`${API_URL}/profitability/${clientId}`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour récupérer la rentabilité d'un client spécifique ===
  
  // === Début : Fonction pour mettre à jour le tarif horaire ===
  // Explication simple : Cette fonction change le prix que tu demandes pour une heure de travail avec un client.
  // Explication technique : Méthode asynchrone qui envoie une requête PUT à l'API pour modifier le taux horaire facturable d'un client identifié par son ID.
  // Mettre à jour le taux horaire d'un client
  updateHourlyRate: async (clientId: string, hourlyRate: number): Promise<ApiResponse<ProfitabilityData>> => {
    const response = await axios.put(
      `${API_URL}/profitability/${clientId}/hourly-rate`, 
      { hourlyRate }, 
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  // === Fin : Fonction pour mettre à jour le tarif horaire ===
  
  // === Début : Fonction pour mettre à jour les heures passées ===
  // Explication simple : Cette fonction met à jour le nombre d'heures que tu as travaillées pour un client.
  // Explication technique : Méthode asynchrone qui effectue une requête PUT pour actualiser le nombre d'heures consacrées à un client, avec option pour incrémenter plutôt que remplacer.
  // Mettre à jour les heures passées pour un client
  updateSpentHours: async (clientId: string, spentHours: number, incrementOnly: boolean = false): Promise<ApiResponse<ProfitabilityData>> => {
    const response = await axios.put(
      `${API_URL}/profitability/${clientId}/spent-hours`, 
      { spentHours, incrementOnly }, 
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  // === Fin : Fonction pour mettre à jour les heures passées ===
  
  // === Début : Fonction pour mettre à jour les heures cibles ===
  // Explication simple : Cette fonction change le nombre d'heures que tu prévois de travailler pour un client chaque mois.
  // Explication technique : Méthode asynchrone qui met à jour l'objectif d'heures mensuelles pour un client via l'API, permettant de recalculer les métriques de rentabilité associées.
  // Mettre à jour les heures cibles pour un client
  updateTargetHours: async (clientId: string, targetHours: number): Promise<ApiResponse<ProfitabilityData>> => {
    const response = await axios.put(
      `${API_URL}/profitability/${clientId}/target-hours`, 
      { targetHours }, 
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  // === Fin : Fonction pour mettre à jour les heures cibles ===
  
  // === Début : Fonction pour créer ou mettre à jour toutes les données de rentabilité ===
  // Explication simple : Cette fonction enregistre ou met à jour toutes les informations d'argent pour un client en une seule fois.
  // Explication technique : Méthode asynchrone qui crée ou remplace l'ensemble des données de rentabilité d'un client via une requête POST à l'API, permettant des mises à jour globales.
  // Créer ou mettre à jour les données de rentabilité complètes pour un client
  createOrUpdateProfitability: async (profitabilityData: CreateProfitabilityData): Promise<ApiResponse<ProfitabilityData>> => {
    const response = await axios.post(
      `${API_URL}/profitability`, 
      profitabilityData, 
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  // === Fin : Fonction pour créer ou mettre à jour toutes les données de rentabilité ===
  
  // === Début : Fonction pour récupérer un résumé global de rentabilité ===
  // Explication simple : Cette fonction te donne un aperçu rapide de l'argent que tu gagnes avec tous tes clients ensemble.
  // Explication technique : Méthode asynchrone qui récupère un résumé consolidé des métriques de rentabilité pour l'ensemble des clients, permettant une vue d'ensemble financière.
  // Récupérer un résumé global de la rentabilité
  getGlobalSummary: async (): Promise<ApiResponse<any>> => {
    const response = await axios.get(`${API_URL}/profitability/summary/global`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour récupérer un résumé global de rentabilité ===
  
  // === Début : Fonction pour récupérer les tâches d'un client avec le temps passé ===
  // Explication simple : Cette fonction te montre toutes les tâches que tu as faites pour un client et combien de temps tu y as passé.
  // Explication technique : Méthode asynchrone qui interroge l'API pour obtenir la liste des tâches associées à un client avec leurs données de suivi de temps, facilitant l'analyse détaillée de la rentabilité.
  // Récupérer les tâches avec le temps passé pour un client
  getClientTasks: async (clientId: string): Promise<ApiResponse<any[]>> => {
    const response = await axios.get(`${API_URL}/profitability/tasks/${clientId}`, { headers: getAuthHeader() });
    return response.data;
  }
  // === Fin : Fonction pour récupérer les tâches d'un client avec le temps passé ===
};
// === Fin : Définition du service de rentabilité ===
