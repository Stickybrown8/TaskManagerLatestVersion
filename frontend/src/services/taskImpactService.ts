import api from './api'; // Import the configured Axios instance
import { AxiosResponse } from 'axios'; // Still useful for typing responses

// Base Task interface (consider moving to a global types file if used elsewhere)
export interface BaseTask {
  _id: string;
  title: string;
  // Add other common task properties as needed
}

// Task identified as high impact
export interface HighImpactTask extends BaseTask {
  isHighImpact: true;
  impactScore: number;
  // Potentially other specific fields
}

// Payload for updating a task's impact status
export interface UpdateTaskImpactPayload {
  isHighImpact: boolean;
  impactScore: number;
}

// Result of task impact analysis (adjust based on actual backend response)
export interface TaskImpactAnalysisResult {
  suggestedHighImpactTasks: string[];
  suggestedLowImpactTasks: string[];
  analysisDetails?: string | object; // Could be more structured
  // Other relevant analysis data
}

// Individual task update based on impact analysis
export interface TaskUpdateForImpact {
  taskId: string;
  isHighImpact?: boolean;
  impactScore?: number;
  // Other fields that might be updated
}

// Payload for applying impact analysis
export interface ApplyImpactAnalysisPayload {
  taskUpdates: TaskUpdateForImpact[];
}

// Response type for applyImpactAnalysis, aligning with taskImpactSlice.ts
export interface ApplyImpactAnalysisResponse {
  results: Array<{ success: boolean; task: BaseTask }>;
}

// Service for task impact management
export const taskImpactService = {
  // Récupérer toutes les tâches à fort impact
  getHighImpactTasks: async (): Promise<HighImpactTask[]> => {
    const response: AxiosResponse<HighImpactTask[]> = await api.get(`/api/taskImpact/highImpact`);
    return response.data;
  },
  
  // Mettre à jour le statut d'impact d'une tâche
  updateTaskImpact: async (taskId: string, payload: UpdateTaskImpactPayload): Promise<BaseTask> => { // Returns the updated task
    const response: AxiosResponse<BaseTask> = await api.put(
      `/api/taskImpact/${taskId}`, 
      payload
    );
    return response.data;
  },
  
  // Analyser les tâches pour identifier celles à fort impact
  // Note: Changed to POST as per api.ts definition, might take parameters in body if needed
  analyzeTasksImpact: async (params?: any): Promise<TaskImpactAnalysisResult> => { 
    const response: AxiosResponse<TaskImpactAnalysisResult> = await api.post(`/api/taskImpact/analyze`, params);
    return response.data;
  },
  
  // Appliquer les recommandations d'analyse d'impact
  applyImpactAnalysis: async (payload: ApplyImpactAnalysisPayload): Promise<ApplyImpactAnalysisResponse> => {
    const response: AxiosResponse<ApplyImpactAnalysisResponse> = await api.post(
      `/api/taskImpact/apply`, 
      payload 
    );
    return response.data;
  }
};
