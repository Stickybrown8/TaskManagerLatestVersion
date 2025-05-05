import { useState } from 'react';
import axios from 'axios';
import { useAppDispatch } from '../store/index';
import { addNotification } from '../store/slices/uiSlice';

const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  points: number;
}

export const useGamification = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  // Ajoute de l'expérience à l'utilisateur
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

  // Vérifie si de nouveaux achievements sont débloqués
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

  // Affiche une récompense
  const showReward = (achievement: Achievement) => {
    dispatch(addNotification({
      message: `🏆 Achievement débloqué: ${achievement.title}`,
      type: 'success'
    }));
    
    triggerConfetti();
  };

  // Fonction pour déclencher un effet confetti
  const triggerConfetti = () => {
    // Utiliser votre composant ConfettiEffect existant
    const event = new CustomEvent('trigger-confetti');
    window.dispatchEvent(event);
  };

  return {
    addExperience,
    checkAchievement,
    showReward,
    loading
  };
};