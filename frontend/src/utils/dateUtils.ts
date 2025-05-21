// === Ce fichier contient des outils pour travailler avec les dates et le temps === /workspaces/TaskManagerLatestVersion/frontend/src/utils/dateUtils.ts
// Explication simple : Ce fichier est comme une boîte à outils spéciale pour tout ce qui concerne les dates et le temps - il te permet de transformer les secondes en heures et minutes, de comparer des dates, ou de les afficher joliment.
// Explication technique : Module utilitaire TypeScript qui fournit des fonctions pures pour manipuler, formater et comparer des dates et des durées, offrant des abstractions sur l'API JavaScript Date native.
// Utilisé dans : Les composants qui affichent des dates ou des durées comme TaskItem, TaskDetail, TimerDisplay, DatePicker, et dans les calculs liés au temps dans les services.
// Connecté à : Aucune dépendance directe, mais utilisé par de nombreux composants et services qui travaillent avec des dates et des durées.

/**
 * Utilitaires pour la manipulation des dates et des durées
 */

// === Début : Formatage de durée en format horloge ===
// Explication simple : Cette fonction transforme un nombre de secondes en un joli format d'horloge comme "01:30:45" pour 1 heure, 30 minutes et 45 secondes.
// Explication technique : Fonction pure qui convertit une durée en secondes en format standardisé HH:MM:SS avec padding de zéros, utilisée pour l'affichage de timers et de durées précises.
/**
 * Formate une durée en secondes vers le format HH:MM:SS
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
// === Fin : Formatage de durée en format horloge ===

// === Début : Formatage de durée en langage naturel ===
// Explication simple : Cette fonction transforme un nombre de secondes en un texte facile à lire comme "2h 30min" au lieu d'un format d'horloge.
// Explication technique : Fonction qui convertit une durée en secondes en format textuel humainement lisible, adaptant la sortie en fonction de la durée (heures et/ou minutes).
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
// === Fin : Formatage de durée en langage naturel ===

// === Début : Génération d'un intervalle de dates ===
// Explication simple : Cette fonction crée une liste de toutes les dates entre deux dates, comme si tu écrivais tous les jours dans ton agenda du 1er au 15 janvier.
// Explication technique : Fonction qui génère un tableau contenant tous les objets Date entre deux dates spécifiées, utilisée pour créer des séquences de dates pour les calendriers et les rapports.
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
// === Fin : Génération d'un intervalle de dates ===

// === Début : Sélection d'une plage de dates selon une période ===
// Explication simple : Cette fonction te donne la date de début et de fin quand tu demandes "la semaine dernière" ou "le mois dernier", comme un raccourci pour ne pas avoir à chercher des dates précises.
// Explication technique : Fonction qui calcule dynamiquement une période de temps (jour, semaine, mois, année) à partir de la date actuelle, retournant les dates de début et de fin formatées.
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
// === Fin : Sélection d'une plage de dates selon une période ===

// === Début : Conversion d'une date au format YYYY-MM-DD ===
// Explication simple : Cette fonction transforme une date en un format standard comme "2025-05-21", facile à utiliser dans des formulaires ou à stocker.
// Explication technique : Utilitaire simple qui extrait la partie date (YYYY-MM-DD) d'un objet Date, couramment utilisé pour l'intégration avec des champs de formulaire HTML.
/**
 * Convertit une date en format YYYY-MM-DD
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
// === Fin : Conversion d'une date au format YYYY-MM-DD ===

// === Début : Calcul du pourcentage d'utilisation ===
// Explication simple : Cette fonction calcule quel pourcentage d'un total a déjà été utilisé, comme quand tu veux savoir que tu as dépensé 75% de ton argent de poche.
// Explication technique : Fonction simple qui calcule le ratio entre une valeur dépensée et un budget total, avec gestion du cas où le total est zéro, utilisée pour les visuels de progression.
/**
 * Calcule le pourcentage utilisé d'un budget
 */
export const calculatePercentageUsed = (spent: number, total: number): number => {
  if (total <= 0) return 0;
  return (spent / total) * 100;
};
// === Fin : Calcul du pourcentage d'utilisation ===

// === Début : Vérification si une date est aujourd'hui ===
// Explication simple : Cette fonction te dit si une date est aujourd'hui ou non, comme quand tu veux savoir si c'est le jour de ton anniversaire.
// Explication technique : Prédicat qui compare les composants jour, mois et année d'une date avec ceux de la date actuelle, utilisé pour mettre en évidence des éléments liés à la journée en cours.
/**
 * Vérifie si une date est aujourd'hui
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};
// === Fin : Vérification si une date est aujourd'hui ===

// === Début : Formatage d'une date en français ===
// Explication simple : Cette fonction transforme une date en texte en français, comme "jeudi 1 avril 2025", pour que ce soit joli et facile à lire.
// Explication technique : Fonction qui utilise l'API Intl.DateTimeFormat pour formater une date selon les conventions françaises, spécifiant les options de format pour inclure le jour de la semaine, le jour, le mois et l'année.
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
// === Fin : Formatage d'une date en français ===

// === Début : Formatage d'une date en français avec capitale ===
// Explication simple : Cette fonction fait la même chose que celle du dessus, mais elle s'assure que la première lettre est toujours en majuscule, comme "Jeudi" au lieu de "jeudi".
// Explication technique : Fonction qui étend formatDateFrench pour garantir que la première lettre du résultat est en majuscule, suivant les conventions typographiques françaises pour les dates.
/**
 * Formate une date au format "Jour J mois AAAA" en français avec première lettre en majuscule
 * Exemple: "Jeudi 1 avril 2025"
 */
export const formatDateFrenchCapitalized = (date: Date): string => {
  const formatted = formatDateFrench(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};
// === Fin : Formatage d'une date en français avec capitale ===

// === Début : Recherche du premier jour de la semaine ===
// Explication simple : Cette fonction trouve le lundi de la semaine pour n'importe quelle date, comme quand tu veux savoir quand commence ta semaine d'école.
// Explication technique : Fonction qui calcule la date du lundi (premier jour de la semaine en France) pour n'importe quelle date donnée, en tenant compte du cas particulier du dimanche (0 en JavaScript).
/**
 * Obtient le premier jour de la semaine (lundi) pour une date donnée
 */
export const getFirstDayOfWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuste quand le jour est dimanche
  return new Date(date.setDate(diff));
};
// === Fin : Recherche du premier jour de la semaine ===

// === Début : Recherche du dernier jour de la semaine ===
// Explication simple : Cette fonction trouve le dimanche de la semaine pour n'importe quelle date, comme quand tu veux savoir quand finit ta semaine de vacances.
// Explication technique : Fonction qui utilise getFirstDayOfWeek puis ajoute 6 jours pour obtenir le dimanche (dernier jour de la semaine), permettant de définir des intervalles hebdomadaires complets.
/**
 * Obtient le dernier jour de la semaine (dimanche) pour une date donnée
 */
export const getLastDayOfWeek = (date: Date): Date => {
  const firstDay = getFirstDayOfWeek(new Date(date));
  const lastDay = new Date(firstDay);
  lastDay.setDate(lastDay.getDate() + 6);
  return lastDay;
};
// === Fin : Recherche du dernier jour de la semaine ===

// === Début : Vérification si deux dates sont le même jour ===
// Explication simple : Cette fonction vérifie si deux dates tombent le même jour, comme quand tu veux savoir si deux anniversaires sont le même jour même s'ils sont à des heures différentes.
// Explication technique : Prédicat qui compare uniquement les composants jour, mois et année de deux objets Date, ignorant les heures et minutes, pour déterminer s'ils représentent le même jour calendaire.
/**
 * Vérifie si deux dates sont le même jour
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
};
// === Fin : Vérification si deux dates sont le même jour ===

// === Début : Ajout de jours à une date ===
// Explication simple : Cette fonction ajoute un certain nombre de jours à une date, comme quand tu veux savoir quelle date sera dans 10 jours.
// Explication technique : Fonction utilitaire qui crée une nouvelle instance de Date puis modifie sa valeur en ajoutant le nombre de jours spécifié, sans altérer la date originale.
/**
 * Ajoute des jours à une date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
// === Fin : Ajout de jours à une date ===