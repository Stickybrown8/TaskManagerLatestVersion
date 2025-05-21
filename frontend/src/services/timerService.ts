import api from './api'; // Import the configured Axios instance
import { AxiosResponse } from 'axios'; // Still useful for typing responses

// Define Timer-related interfaces
export interface Timer {
  _id: string;
  startTime: string | Date;
  endTime?: string | Date;
  duration?: number; // Assuming duration is in seconds
  description?: string;
  billable?: boolean;
  userId?: string;
  clientId?: string | { _id: string; name: string }; // Can be populated
  taskId?: string | { _id: string; title: string };   // Can be populated
  // Add other relevant fields like isPaused, pauseHistory, etc. if needed
}

export interface TimerStartPayload {
  description?: string;
  billable?: boolean;
  clientId?: string;
  taskId?: string;
  startTime?: string | Date; // Optional: backend might set this to now()
}

export interface TimerStopPayload {
  // Backend usually calculates endTime and duration upon stopping
  // Payload might be empty or carry specific instructions if needed
}

// Service for timer management
export const timerService = {
  // Récupérer tous les chronomètres
  getAllTimers: async (): Promise<Timer[]> => {
    const response: AxiosResponse<Timer[]> = await api.get(`/api/timers`);
    return response.data;
  },
  
  // Récupérer le chronomètre en cours d'exécution
  getRunningTimer: async (): Promise<Timer | null> => { // Can be null if no timer is running
    const response: AxiosResponse<Timer | Timer[]> = await api.get(`/api/timers/running`);
    // Backend might return a single timer or an array with one item
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    } else if (!Array.isArray(response.data) && response.data) {
      return response.data as Timer;
    }
    return null;
  },
  
  // Récupérer un chronomètre par son ID
  getTimerById: async (id: string): Promise<Timer> => {
    const response: AxiosResponse<Timer> = await api.get(`/api/timers/${id}`);
    return response.data;
  },
  
  // Démarrer un nouveau chronomètre
  startTimer: async (timerData: TimerStartPayload): Promise<Timer> => {
    const response: AxiosResponse<Timer> = await api.post(`/api/timers`, timerData);
    return response.data;
  },
  
  // Mettre en pause un chronomètre
  pauseTimer: async (id: string): Promise<Timer> => {
    const response: AxiosResponse<Timer> = await api.put(`/api/timers/${id}/pause`, {});
    return response.data;
  },
  
  // Reprendre un chronomètre en pause
  resumeTimer: async (id: string): Promise<Timer> => {
    const response: AxiosResponse<Timer> = await api.put(`/api/timers/${id}/resume`, {});
    return response.data;
  },
  
  // Arrêter un chronomètre
  stopTimer: async (id: string, payload?: TimerStopPayload): Promise<Timer> => { // Payload might be empty
    const response: AxiosResponse<Timer> = await api.put(`/api/timers/${id}/stop`, payload || {});
    return response.data;
  },
  
  // Supprimer un chronomètre
  deleteTimer: async (id: string): Promise<void> => { // Typically returns 204 No Content or a success message
    await api.delete(`/api/timers/${id}`);
    // If backend returns data (e.g., { message: "deleted" }), adjust Promise type
  },
  
  // Récupérer les chronomètres d'un client spécifique
  getClientTimers: async (clientId: string): Promise<Timer[]> => {
    const response: AxiosResponse<Timer[]> = await api.get(`/api/timers/client/${clientId}`);
    return response.data;
  },
  
  // Récupérer les chronomètres d'une tâche spécifique
  getTaskTimers: async (taskId: string): Promise<Timer[]> => {
    const response: AxiosResponse<Timer[]> = await api.get(`/api/timers/task/${taskId}`);
    return response.data;
  }
};
