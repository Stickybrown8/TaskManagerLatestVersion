/**
 * Utilitaires pour la manipulation des dates et des durées
 */

/**
 * Formate une durée en secondes vers le format HH:MM:SS
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Formate une durée en secondes vers un format lisible (Xh Ymin)
 */
export const formatDurationHuman = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes} min`;
  }
  
  return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
};

/**
 * Génère un intervalle de dates entre deux dates
 */
export const getDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
};

/**
 * Définit une plage de dates en fonction d'une période
 */
export const getDateRangeByPeriod = (period: 'day' | 'week' | 'month' | 'year' | 'custom'): { startDate: string, endDate: string } => {
  const today = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'day':
      // Aujourd'hui
      startDate = new Date(today);
      break;
    case 'week':
      // 7 derniers jours
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    case 'month':
      // 30 derniers jours
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      break;
    case 'year':
      // 365 derniers jours
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 365);
      break;
    case 'custom':
      // Retourner les dates actuelles sans modification
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  };
};

/**
 * Convertit une date en format YYYY-MM-DD
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Calcule le pourcentage utilisé d'un budget
 */
export const calculatePercentageUsed = (spent: number, total: number): number => {
  if (total <= 0) return 0;
  return (spent / total) * 100;
};

/**
 * Vérifie si une date est aujourd'hui
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Formate une date au format "Jour J mois AAAA" en français
 * Exemple: "Jeudi 1 avril 2025"
 */
export const formatDateFrench = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  
  return date.toLocaleDateString('fr-FR', options);
};

/**
 * Formate une date au format "Jour J mois AAAA" en français avec première lettre en majuscule
 * Exemple: "Jeudi 1 avril 2025"
 */
export const formatDateFrenchCapitalized = (date: Date): string => {
  const formatted = formatDateFrench(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

/**
 * Obtient le premier jour de la semaine (lundi) pour une date donnée
 */
export const getFirstDayOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuste quand le jour est dimanche
  return new Date(date.setDate(diff));
};

/**
 * Obtient le dernier jour de la semaine (dimanche) pour une date donnée
 */
export const getLastDayOfWeek = (date: Date): Date => {
  const firstDay = getFirstDayOfWeek(new Date(date));
  const lastDay = new Date(firstDay);
  lastDay.setDate(lastDay.getDate() + 6);
  return lastDay;
};

/**
 * Vérifie si deux dates sont le même jour
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
};

/**
 * Ajoute des jours à une date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};