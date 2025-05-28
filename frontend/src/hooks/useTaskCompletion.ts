import { useState } from 'react';
import { useAppDispatch } from '../hooks';
// import { completeTask } from '../store/slices/tasksSlice';
import soundService from '../services/soundService';
import { tasksService } from '../services/api';
import { addNotification } from '../store/slices/uiSlice';

export const useTaskCompletion = () => {
  const [showConfetti, setShowConfetti] = useState(false);
  const dispatch = useAppDispatch();

  const handleCompleteTask = async (taskId: string) => {
    try {
      const result = await tasksService.completeTask(taskId);
      
      // Jouer le son de succès
      soundService.play('task_complete');
      
      // Afficher les confettis
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Notification de succès
      dispatch(addNotification({
        message: 'Tâche terminée avec succès! 🎉',
        type: 'success'
      }));
    } catch (error) {
      soundService.play('error');
      dispatch(addNotification({
        message: 'Erreur lors de la complétion',
        type: 'error'
      }));
    }
  };

  return { handleCompleteTask, showConfetti };
};
