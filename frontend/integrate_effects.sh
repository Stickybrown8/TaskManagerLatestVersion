#!/bin/bash

echo "🎉 Intégration des effets dans Tasks.tsx"
echo "========================================"

# Ajouter les imports
if ! grep -q "useTaskCompletion" src/pages/Tasks.tsx; then
    sed -i "/^import.*hooks';$/a import { useTaskCompletion } from '../hooks/useTaskCompletion';" src/pages/Tasks.tsx
    echo "✅ Import useTaskCompletion ajouté"
fi

if ! grep -q "ConfettiEffect" src/pages/Tasks.tsx; then
    sed -i "/^import.*framer-motion';$/a import ConfettiEffect from '../components/gamification/ConfettiEffect';" src/pages/Tasks.tsx
    echo "✅ Import ConfettiEffect ajouté"
fi

echo ""
echo "📝 Ajoutez manuellement dans le composant Tasks:"
echo "1. Après les autres hooks:"
echo "   const { handleCompleteTask, showConfetti } = useTaskCompletion();"
echo ""
echo "2. Dans le return, après le dernier </div>:"
echo "   <ConfettiEffect show={showConfetti} />"
echo ""
echo "3. Remplacez les appels de complétion par:"
echo "   onClick={() => handleCompleteTask(task._id)}"

