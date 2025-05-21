import api from './api'; // Import the configured Axios instance
import { AxiosResponse } from 'axios'; // Still useful for typing responses

// API_URL is no longer needed here as api.ts handles the base URL

// Define the Objective interface based on expected data structure
export interface Objective {
  _id: string;
  clientId?: string;
  name: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline?: string | Date;
  isHighImpact?: boolean;
  linkedTasks?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Data for creating a new objective
export type ObjectiveCreateData = Omit<Objective, '_id' | 'currentValue' | 'createdAt' | 'updatedAt'> & {
  currentValue?: number;
};

// Data for updating an objective (all fields optional)
export type ObjectiveUpdateData = Partial<ObjectiveCreateData>;

// Data for updating progress
export interface ProgressUpdateData {
  currentValue: number;
}

// Service for objectives
export const objectivesService = {
  // Récupérer tous les objectifs
  getAll: async (): Promise<Objective[]> => {
    // Note: URLs are now relative to the baseURL configured in api.ts
    const response: AxiosResponse<Objective[]> = await api.get(`/api/objectives`);
    return response.data;
  },
  
  // Récupérer un objectif par son ID
  getById: async (id: string): Promise<Objective> => {
    const response: AxiosResponse<Objective> = await api.get(`/api/objectives/${id}`);
    return response.data;
  },
  
  // Récupérer les objectifs d'un client spécifique
  getByClient: async (clientId: string): Promise<Objective[]> => {
    const response: AxiosResponse<Objective[]> = await api.get(`/api/objectives/client/${clientId}`);
    return response.data;
  },
  
  // Récupérer les objectifs à fort impact (80/20)
  getHighImpact: async (): Promise<Objective[]> => {
    const response: AxiosResponse<Objective[]> = await api.get(`/api/objectives/high-impact`);
    return response.data;
  },
  
  // Créer un nouvel objectif
  create: async (objectiveData: ObjectiveCreateData): Promise<Objective> => {
    const response: AxiosResponse<Objective> = await api.post(`/api/objectives`, objectiveData);
    return response.data;
  },
  
  // Mettre à jour un objectif
  update: async (id: string, objectiveData: ObjectiveUpdateData): Promise<Objective> => {
    const response: AxiosResponse<Objective> = await api.put(`/api/objectives/${id}`, objectiveData);
    return response.data;
  },
  
  // Mettre à jour la progression d'un objectif
  updateProgress: async (id: string, progressData: ProgressUpdateData): Promise<Objective> => {
    const response: AxiosResponse<Objective> = await api.put(`/api/objectives/${id}/progress`, progressData);
    return response.data;
  },
  
  // Supprimer un objectif
  delete: async (id: string): Promise<any> => { // Backend might return a success message or the deleted object
    const response: AxiosResponse<any> = await api.delete(`/api/objectives/${id}`);
    return response.data;
  },
  
  // Lier une tâche à un objectif
  linkTask: async (objectiveId: string, taskId: string): Promise<Objective> => {
    // Adjusted endpoint based on the one removed from api.ts, assuming it was /api/objectives/:objectiveId/tasks/:taskId
    // If it was /link-task/, then it should be /api/objectives/${objectiveId}/link-task/${taskId}
    const response: AxiosResponse<Objective> = await api.post(`/api/objectives/${objectiveId}/link-task/${taskId}`, {});
    return response.data;
  },
  
  // Délier une tâche d'un objectif
  unlinkTask: async (objectiveId: string, taskId: string): Promise<Objective> => {
    // Adjusted endpoint based on the one removed from api.ts
    const response: AxiosResponse<Objective> = await api.delete(`/api/objectives/${objectiveId}/unlink-task/${taskId}`);
    return response.data;
  }
};
