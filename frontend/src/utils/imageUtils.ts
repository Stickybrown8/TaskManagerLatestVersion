import { getImageUrl as getImageUrlFromApi } from '../services/api';
// === Utilitaires pour la gestion des images ===

const getApiBaseUrl = (): string => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace('/api', '');
  }
  
  const hostname = window.location.hostname;
  const codespaceMatch = hostname.match(/^(.+)\.github\.dev$/);
  if (codespaceMatch) {
    return `https://${codespaceMatch[1]}-5000.app.github.dev`;
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return getImageUrlFromApi('').replace('/api', '');
  }
  
  return 'https://task-manager-api-yx13.onrender.com';
};

export const getLogoUrl = (logoPath?: string): string => {
  return getImageUrlFromApi(logoPath);
};

export const getAvatarUrl = (avatarPath?: string): string => {
  return getImageUrlFromApi(avatarPath);
};

export const getColorFromText = (text: string): string => {
  const colors = [
    'from-primary-500 to-primary-600',
    'from-cyan-500 to-cyan-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-indigo-500 to-indigo-600',
  ];
  
  const sum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[sum % colors.length];
};

const imageUtils = {
  getLogoUrl,
  getAvatarUrl,
  getColorFromText
};

export default imageUtils;