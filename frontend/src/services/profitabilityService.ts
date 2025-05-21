import api from './api'; // Import the configured Axios instance
import { AxiosResponse } from 'axios'; // Still useful for typing responses

// Define Profitability-related interfaces
export interface ProfitabilityData {
  _id: string; 
  clientId: string;
  clientName?: string;
  totalRevenue: number;
  totalCost: number;
  profitMargin: number;
  hourlyRate?: number;
  spentHours?: number;
  targetHours?: number;
  // Add other fields based on actual backend data structure
}

export interface HourlyRateUpdatePayload {
  hourlyRate: number;
}

export interface SpentHoursUpdatePayload {
  spentHours: number;
  incrementOnly?: boolean;
}

export interface TargetHoursUpdatePayload {
  targetHours: number;
}

// For creating or updating profitability data, adjust based on backend needs
export type ProfitabilityInputData = Partial<Omit<ProfitabilityData, '_id' | 'clientName' | 'profitMargin'>>;

export interface GlobalProfitabilitySummary {
  totalClients: number;
  overallRevenue: number;
  overallCost: number;
  averageProfitMargin: number;
  // Add other fields based on actual backend data structure
}

export interface ClientTaskInfo {
  taskId: string;
  taskTitle: string;
  timeSpent: number; // Define unit, e.g., hours
  // Add other fields as necessary
}

// Service for profitability management
export const profitabilityService = {
  // Récupérer les données de rentabilité pour tous les clients
  getAllProfitability: async (): Promise<ProfitabilityData[]> => {
    const response: AxiosResponse<ProfitabilityData[]> = await api.get(`/api/profitability/all`); // Path from old api.ts
    return response.data;
  },
  
  // Récupérer les données de rentabilité pour un client spécifique
  getClientProfitability: async (clientId: string): Promise<ProfitabilityData> => {
    const response: AxiosResponse<ProfitabilityData> = await api.get(`/api/profitability/client/${clientId}`); // Path from old api.ts
    return response.data;
  },
  
  // Mettre à jour le taux horaire d'un client
  updateHourlyRate: async (clientId: string, payload: HourlyRateUpdatePayload): Promise<ProfitabilityData> => {
    const response: AxiosResponse<ProfitabilityData> = await api.put(
      `/api/profitability/hourlyRate/${clientId}`, // Path from old api.ts
      payload 
    );
    return response.data;
  },
  
  // Mettre à jour les heures passées pour un client
  updateSpentHours: async (clientId: string, payload: SpentHoursUpdatePayload): Promise<ProfitabilityData> => {
    const response: AxiosResponse<ProfitabilityData> = await api.put(
      `/api/profitability/spentHours/${clientId}`, // Path from old api.ts
      payload 
    );
    return response.data;
  },
  
  // Mettre à jour les heures cibles pour un client
  updateTargetHours: async (clientId: string, payload: TargetHoursUpdatePayload): Promise<ProfitabilityData> => {
    const response: AxiosResponse<ProfitabilityData> = await api.put(
      `/api/profitability/targetHours/${clientId}`, // Path from old api.ts
      payload 
    );
    return response.data;
  },
  
  // Créer ou mettre à jour les données de rentabilité complètes pour un client
  // Assuming this maps to a POST request to /api/profitability or similar
  // The original file had POST to `${API_URL}/profitability`
  createOrUpdateProfitability: async (profitabilityData: ProfitabilityInputData): Promise<ProfitabilityData> => {
    // If creating, backend should assign clientId if not provided, or it should be part of ProfitabilityInputData
    // If updating, clientId should be part of the data or path. Let's assume POST to base for create, PUT to /:id for update.
    // For simplicity, matching original file's POST to base for now.
    const response: AxiosResponse<ProfitabilityData> = await api.post(
      `/api/profitability`, 
      profitabilityData
    );
    return response.data;
  },
  
  // Récupérer un résumé global de la rentabilité
  getGlobalProfitabilitySummary: async (): Promise<GlobalProfitabilitySummary> => {
    const response: AxiosResponse<GlobalProfitabilitySummary> = await api.get(`/api/profitability/summary`); // Path from old api.ts
    return response.data;
  },
  
  // Récupérer les tâches avec le temps passé pour un client
  getClientTasks: async (clientId: string): Promise<ClientTaskInfo[]> => {
    const response: AxiosResponse<ClientTaskInfo[]> = await api.get(`/api/profitability/tasks/${clientId}`); // Path from old api.ts
    return response.data;
  }
};
