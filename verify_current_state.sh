#!/bin/bash
echo "🔍 VÉRIFICATION ÉTAT ACTUEL"
echo "=========================="

# Backend
echo -e "\n📦 BACKEND:"
cd backend
echo -n "1. Activity dans completeTask: "
grep -c "Activity.create" controllers/taskController.js && echo "✅ Présent" || echo "❌ Manquant"
echo -n "2. Imports dans taskController: "
grep -E "Activity|Badge" controllers/taskController.js | head -2

# Frontend - Tasks
echo -e "\n📄 FRONTEND - TASKS:"
cd ../frontend
echo -n "1. useTaskCompletion utilisé: "
grep -c "const { handleCompleteTask, showConfetti }" src/pages/TasksPage.tsx && echo "✅" || echo "❌"
echo -n "2. handleStatusUpdate ligne: "
grep -n "const handleStatusUpdate" src/pages/TasksPage.tsx | cut -d: -f1
echo -n "3. ConfettiEffect présent: "
grep -c "<ConfettiEffect" src/pages/TasksPage.tsx && echo "✅" || echo "❌"

# Frontend - TimerPopup
echo -e "\n⏱️ FRONTEND - TIMERPOPUP:"
echo "1. Chemin du fichier TimerPopup:"
find src -name "TimerPopup.tsx" -type f 2>/dev/null | head -1
echo "2. Imports actuels:"
find src -name "TimerPopup.tsx" -type f -exec head -20 {} \; 2>/dev/null | grep "^import"
echo -n "3. useTaskCompletion importé: "
find src -name "TimerPopup.tsx" -type f -exec grep -c "useTaskCompletion" {} \; 2>/dev/null | head -1 && echo "✅" || echo "❌"

# Sons disponibles
echo -e "\n🔊 SONS DISPONIBLES:"
ls public/sounds/ 2>/dev/null | wc -l && ls public/sounds/ 2>/dev/null

# Hooks existants
echo -e "\n🪝 HOOKS DISPONIBLES:"
ls src/hooks/ 2>/dev/null

