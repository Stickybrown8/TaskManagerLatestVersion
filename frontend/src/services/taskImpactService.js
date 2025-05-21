// === Ce fichier identifie et gère les tâches les plus importantes qui apportent le plus de résultats === /workspaces/TaskManagerLatestVersion/frontend/src/services/taskImpactService.js
// Explication simple : Ce fichier contient des fonctions qui t'aident à trouver les tâches qui valent vraiment la peine d'être faites en priorité, comme quand tu choisis quels devoirs faire en premier pour avoir les meilleures notes.
// Explication technique : Module de service JavaScript qui encapsule les appels API liés à l'analyse d'impact des tâches selon le principe de Pareto (80/20), permettant d'identifier et gérer les tâches à fort impact.
// Utilisé dans : Les composants d'analyse de tâches, les pages de planification stratégique, les tableaux de bord de productivité, et tout composant qui affiche ou filtre les tâches par impact.
// Connecté à : API backend via Axios, service d'authentification (authHeader), et composants React qui gèrent la priorisation et l'analyse des tâches.

import axios from 'axios';
import { getAuthHeader } from './authHeader';

// === Début : Configuration de l'URL de l'API ===
// Explication simple : C'est l'adresse où l'application va chercher et envoyer les informations, comme l'adresse de ton école où tu déposes et récupères tes devoirs.
// Explication technique : Constante qui définit l'URL de base pour les requêtes API, récupérée depuis les variables d'environnement ou utilisant une valeur par défaut pour le développement local.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// === Fin : Configuration de l'URL de l'API ===

// === Début : Définition du service d'analyse d'impact des tâches ===
// Explication simple : C'est comme une boîte magique qui contient tous les outils pour savoir quelles tâches sont les plus importantes pour réussir.
// Explication technique : Objet exporté qui encapsule une collection de méthodes asynchrones pour interagir avec les points d'API relatifs à l'analyse d'impact des tâches selon le principe de Pareto.
// Service pour la gestion des tâches à fort impact (principe 80/20)
export const taskImpactService = {
  // === Début : Fonction pour récupérer les tâches à fort impact ===
  // Explication simple : Cette fonction va chercher la liste des tâches super importantes qui vont t'apporter les meilleurs résultats.
  // Explication technique : Méthode asynchrone qui effectue une requête GET à l'API pour récupérer les tâches identifiées comme ayant un fort impact selon l'analyse de Pareto.
  // Récupérer toutes les tâches à fort impact
  getHighImpactTasks: async () => {
    const response = await axios.get(`${API_URL}/tasks/high-impact`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction pour récupérer les tâches à fort impact ===
  
  // === Début : Fonction pour mettre à jour l'impact d'une tâche ===
  // Explication simple : Cette fonction change l'importance d'une tâche, comme quand tu décides qu'un devoir mérite plus d'attention qu'un autre.
  // Explication technique : Méthode asynchrone qui effectue une requête PUT pour modifier le statut d'impact et le score d'une tâche spécifique identifiée par son ID.
  // Mettre à jour le statut d'impact d'une tâche
  updateTaskImpact: async (taskId, isHighImpact, impactScore) => {
    const response = await axios.put(
      `${API_URL}/tasks/${taskId}/impact`, 
      { isHighImpact, impactScore }, 
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  // === Fin : Fonction pour mettre à jour l'impact d'une tâche ===
  
  // === Début : Fonction d'analyse automatique de l'impact des tâches ===
  // Explication simple : Cette fonction analyse toutes tes tâches pour te dire lesquelles sont les plus importantes, comme un professeur qui t'aiderait à choisir quoi étudier pour l'examen.
  // Explication technique : Méthode asynchrone qui déclenche une analyse algorithmique côté serveur pour identifier automatiquement les tâches à fort impact selon divers critères et le principe 80/20.
  // Analyser les tâches pour identifier celles à fort impact
  analyzeTasksImpact: async () => {
    const response = await axios.get(`${API_URL}/tasks/impact-analysis`, { headers: getAuthHeader() });
    return response.data;
  },
  // === Fin : Fonction d'analyse automatique de l'impact des tâches ===
  
  // === Début : Fonction pour appliquer les recommandations d'impact ===
  // Explication simple : Après avoir analysé tes tâches, cette fonction applique les changements recommandés pour toutes les marquer correctement, comme quand tu colories tes fiches de révision par ordre d'importance.
  // Explication technique : Méthode asynchrone qui envoie une requête POST avec les modifications à appliquer en masse suite à l'analyse d'impact, permettant de mettre à jour plusieurs tâches en une seule opération.
  // Appliquer les recommandations d'analyse d'impact
  applyImpactAnalysis: async (taskUpdates) => {
    const response = await axios.post(
      `${API_URL}/tasks/apply-impact-analysis`, 
      { taskUpdates }, 
      { headers: getAuthHeader() }
    );
    return response.data;
  }
  // === Fin : Fonction pour appliquer les recommandations d'impact ===
};
// === Fin : Définition du service d'analyse d'impact des tâches ===
