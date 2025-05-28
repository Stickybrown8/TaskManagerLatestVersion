#!/bin/bash

echo "🔧 RÉPARATION DE L'INTÉGRATION COMPLÉTION DE TÂCHES"
echo "==================================================="
echo ""

# 1. Ajouter les imports manquants dans task.controller.js
echo "📌 1. Ajout des imports de gamification dans le contrôleur..."
cd backend
if ! grep -q "Activity.*require" controllers/task.controller.js; then
    sed -i "/const Client = require/a const Activity = require('../models/Activity');\nconst Badge = require('../models/Badge');" controllers/task.controller.js
    echo "✅ Imports Activity et Badge ajoutés"
else
    echo "✅ Imports déjà présents"
fi

# 2. Créer l'activité lors de la complétion
echo ""
echo "�� 2. Vérification de la création d'activité dans completeTask..."
if ! grep -q "await Activity.create" controllers/task.controller.js; then
    echo "⚠️  Ajoutez manuellement le code d'activité après la gamification (ligne ~340)"
    echo "    Code à ajouter:"
    echo "    await Activity.create({"
    echo "      userId: req.userId,"
    echo "      type: 'task_completed',"
    echo "      description: \`Tâche \"\${task.title}\" terminée\`,"
    echo "      details: { taskId: task._id, clientId: task.clientId, pointsEarned, experienceEarned }"
    echo "    });"
fi

cd ../frontend

# 3. Vérifier les composants de tâches
echo ""
echo "📌 3. Analyse des composants de tâches..."
echo "Composants trouvés dans src/components/tasks/:"
ls -la src/components/tasks/ 2>/dev/null | grep -E "\.(tsx|ts)$"

# 4. Créer un hook pour gérer la complétion avec effets
echo ""
echo "📌 4. Création du hook useTaskCompletion..."
mkdir -p src/hooks
cat > src/hooks/useTaskCompletion.ts << 'HOOK'
import { useState } from 'react';
import { useAppDispatch } from './redux';
import { completeTask } from '../store/slices/tasksSlice';
import soundService from '../services/soundService';
import { addNotification } from '../store/slices/uiSlice';

export const useTaskCompletion = () => {
  const [showConfetti, setShowConfetti] = useState(false);
  const dispatch = useAppDispatch();

  const handleCompleteTask = async (taskId: string) => {
    try {
      await dispatch(completeTask(taskId)).unwrap();
      
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
HOOK
echo "✅ Hook useTaskCompletion créé"

# 5. Vérifier la page Tasks
echo ""
echo "📌 5. Analyse de la page Tasks..."
if [ -f "src/pages/Tasks.tsx" ]; then
    echo "✅ Tasks.tsx trouvé"
    echo "Imports actuels:"
    grep "^import" src/pages/Tasks.tsx | head -10
    echo ""
    echo "Recherche de completeTask:"
    grep -n "complete" src/pages/Tasks.tsx | head -5
fi

echo ""
echo "📋 RÉSUMÉ DES ACTIONS"
echo "===================="
echo "1. ✅ Vérification des imports gamification"
echo "2. ⚠️  Code d'activité à ajouter manuellement dans le backend"
echo "3. ✅ Hook de complétion créé avec sons et confettis"
echo "4. 📌 Composants de tâches analysés"
echo ""
echo "🎯 PROCHAINES ÉTAPES:"
echo "1. Ajouter dans vos composants de tâches:"
echo "   - import { useTaskCompletion } from '../hooks/useTaskCompletion';"
echo "   - const { handleCompleteTask, showConfetti } = useTaskCompletion();"
echo "2. Ajouter le ConfettiEffect dans la page:"
echo "   - import ConfettiEffect from '../components/gamification/ConfettiEffect';"
echo "   - <ConfettiEffect show={showConfetti} />"
echo "3. Remplacer l'appel de complétion par: handleCompleteTask(taskId)"

