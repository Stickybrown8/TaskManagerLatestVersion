/*
 * GESTIONNAIRE DE SYSTÈME DE JEU - frontend/src/hooks/useGamification.ts
 *
 * Explication simple:
 * Ce fichier crée un système qui ajoute du fun à l'application. C'est comme un jeu où tu
 * gagnes des points en faisant des actions (créer des tâches, terminer un projet...). Tu
 * peux aussi gagner des niveaux et des badges spéciaux appelés "achievements". Quand tu
 * réussis quelque chose d'important, l'application lance même des confettis pour te féliciter!
 *
 * Explication technique:
 * Hook personnalisé React qui encapsule toute la logique de gamification de l'application,
 * permettant d'ajouter de l'expérience aux utilisateurs, de vérifier les achievements débloqués,
 * et de gérer les retours visuels de récompense via des notifications et effets de confettis.
 *
 * Où ce fichier est utilisé:
 * Importé dans différents composants qui déclenchent des actions méritant des points ou
 * pouvant débloquer des achievements, comme les composants de gestion des tâches, des clients
 * ou des projets.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise le hook useAppDispatch depuis '../hooks' pour dispatcher des actions Redux
 * - Importe l'action addNotification depuis '../store/slices/uiSlice'
 * - Communique avec l'API backend via axios pour mettre à jour l'expérience et vérifier les achievements
 * - Interagit avec le système d'événements personnalisés pour déclencher des effets visuels
 */

// === Début : Importation des dépendances et configuration ===
// Explication simple : On prend tous les outils dont on a besoin pour faire fonctionner notre système de jeu, comme quand tu sors tes jouets avant de commencer à jouer.
// Explication technique : Importation des hooks React, de la bibliothèque axios pour les requêtes HTTP, du hook Redux personnalisé et de l'action pour les notifications, ainsi que configuration de l'URL de l'API.
import { useState } from 'react';
import axios from 'axios';
import { useAppDispatch } from '../hooks';
import { addNotification } from '../store/slices/uiSlice';

const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';
// === Fin : Importation des dépendances et configuration ===

// === Début : Définition de l'interface Achievement ===
// Explication simple : On explique à l'ordinateur à quoi ressemble un badge ou une récompense dans notre jeu, comme quand tu décris les règles d'un jeu avant de commencer.
// Explication technique : Déclaration d'une interface TypeScript qui définit la structure des objets Achievement, avec leurs propriétés typées pour assurer la cohérence des données.
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  points: number;
}
// === Fin : Définition de l'interface Achievement ===

// === Début : Définition du hook principal useGamification ===
// Explication simple : On crée une boîte à outils spéciale qui permet d'ajouter du fun dans l'application, avec des points, des niveaux et des confettis!
// Explication technique : Déclaration du hook personnalisé qui expose les fonctions et états liés à la gamification, encapsulant la logique de gestion des points d'expérience et des achievements.
export const useGamification = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
// === Fin : Définition du hook principal useGamification ===

  // === Début : Fonction d'ajout d'expérience ===
  // Explication simple : Cette fonction ajoute des points à ton score quand tu fais une bonne action, et si tu as assez de points, tu montes de niveau avec des confettis!
  // Explication technique : Fonction asynchrone qui envoie une requête à l'API pour créditer des points d'expérience à l'utilisateur, gère la montée de niveau avec notification et effets visuels.
  const addExperience = async (points: number, reason: string = 'Action complétée') => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) throw new Error("Token d'authentification manquant");

      const response = await axios.post(
        `${API_URL}/api/gamification/experience`,
        { points, reason },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Notification si l'utilisateur a gagné un niveau
      if (response.data.levelUp) {
        dispatch(addNotification({
          message: `🎉 Niveau ${response.data.newLevel} atteint! +${response.data.bonusPoints} points bonus`,
          type: 'success'
        }));
        triggerConfetti();
      }

      return response.data;
    } catch (error: any) {
      console.error("Erreur lors de l'ajout d'expérience:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  // === Fin : Fonction d'ajout d'expérience ===

  // === Début : Vérification des achievements ===
  // Explication simple : Cette fonction vérifie si tu as réussi à débloquer des badges spéciaux après avoir fait certaines actions, comme quand un jeu vérifie si tu as battu un record.
  // Explication technique : Fonction asynchrone qui interroge l'API pour vérifier et récupérer les nouveaux achievements débloqués dans une catégorie spécifique.
  const checkAchievement = async (category: string): Promise<Achievement[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];

      const response = await axios.post(
        `${API_URL}/api/gamification/check-achievements`,
        { category },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      return response.data.achievements || [];
    } catch (error) {
      console.error("Erreur lors de la vérification des achievements:", error);
      return [];
    }
  };
  // === Fin : Vérification des achievements ===

  // === Début : Affichage des récompenses ===
  // Explication simple : Cette fonction fait apparaître un joli message et des confettis pour te féliciter quand tu gagnes un badge spécial, comme quand tes amis t'applaudissent pour une victoire.
  // Explication technique : Fonction qui dispatche une notification stylisée pour mettre en évidence un achievement débloqué et déclenche un effet visuel de confettis.
  const showReward = (achievement: Achievement) => {
    dispatch(addNotification({
      message: `🏆 Achievement débloqué: ${achievement.title}`,
      type: 'success'
    }));
    
    triggerConfetti();
  };
  // === Fin : Affichage des récompenses ===

  // === Début : Déclenchement des confettis ===
  // Explication simple : Cette fonction fait pleuvoir des confettis colorés sur l'écran pour célébrer ta réussite, comme lors d'une fête d'anniversaire!
  // Explication technique : Fonction qui émet un événement personnalisé intercepté par ailleurs dans l'application pour déclencher l'animation de confettis.
  const triggerConfetti = () => {
    // Utiliser votre composant ConfettiEffect existant
    const event = new CustomEvent('trigger-confetti');
    window.dispatchEvent(event);
  };
  // === Fin : Déclenchement des confettis ===

  // === Début : Retour des fonctions du hook ===
  // Explication simple : On donne accès à toutes nos fonctions de jeu pour que d'autres parties de l'application puissent les utiliser, comme quand tu partages tes jouets avec tes amis.
  // Explication technique : Retour d'un objet contenant les fonctions et états exposés par le hook, permettant aux composants consommateurs d'utiliser la fonctionnalité de gamification.
  return {
    addExperience,
    checkAchievement,
    showReward,
    loading
  };
  // === Fin : Retour des fonctions du hook ===
};