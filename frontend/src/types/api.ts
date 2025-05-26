// === Types API pour résoudre les erreurs TypeScript ===

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errorCode: string;
}

const getApiUrl = (): string => {
  // Vérifier si on est en développement avec Codespaces
  if (window.location.hostname.includes('github.dev') || 
      window.location.hostname.includes('codespaces')) {
    return 'https://upgraded-eureka-wr5gqw54x4xqc9jvg-5000.app.github.dev';
  }
  
  // Production - URL corrigée
  return 'https://task-manager-api-yx13.onrender.com';
};
