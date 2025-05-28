#!/bin/bash

echo "🔍 DIAGNOSTIC COMPLET DU TASK MANAGER"
echo "====================================="
echo ""

# Variables
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

echo "📌 1. VÉRIFICATION DU TIMER (Cerveau de l'app)"
echo "----------------------------------------------"
# Vérifier l'intégration du timer
echo "Backend - Routes timer:"
grep -n "timer" $BACKEND_DIR/server.js
echo ""
echo "Frontend - Service timer:"
ls -la $FRONTEND_DIR/src/services/timer* 2>/dev/null || echo "❌ Service timer manquant!"
echo ""
echo "Frontend - TimerPopup component:"
ls -la $FRONTEND_DIR/src/components/Timer* 2>/dev/null || echo "❌ Component TimerPopup manquant!"

echo ""
echo "📊 2. VÉRIFICATION GAMIFICATION"
echo "--------------------------------"
# Vérifier les sons
echo "Service de sons:"
ls -la $FRONTEND_DIR/src/services/soundService* 2>/dev/null || echo "❌ soundService manquant!"
echo ""
# Vérifier les événements de gamification
echo "Événements gamification dans taskController:"
grep -n "gamification\|points\|experience\|badge" $BACKEND_DIR/controllers/taskController.js | head -5

echo ""
echo "🎯 3. VÉRIFICATION COMPLÉTIONS DE TÂCHES"
echo "----------------------------------------"
# Vérifier la route de complétion
echo "Route complete task:"
grep -n "complete" $BACKEND_DIR/routes/tasks.js
echo ""
# Vérifier si la complétion déclenche la gamification
echo "Gamification dans complete task:"
grep -A 10 -B 2 "exports.completeTask\|complete.*=.*async" $BACKEND_DIR/controllers/taskController.js | grep -E "gamification|points|badge|activity"

echo ""
echo "🔗 4. CONNEXIONS MANQUANTES"
echo "----------------------------"
# Vérifier les imports de gamification dans les contrôleurs
echo "Import gamification dans taskController:"
grep -n "gamification\|Badge\|Activity" $BACKEND_DIR/controllers/taskController.js | head -5
echo ""
echo "Import User model dans taskController:"
grep -n "User.*require" $BACKEND_DIR/controllers/taskController.js

echo ""
echo "🎨 5. VÉRIFICATION UI/EFFECTS"
echo "------------------------------"
# Vérifier les confettis
echo "Confettis/Animations:"
grep -r "confetti\|Confetti" $FRONTEND_DIR/src/ 2>/dev/null | head -5 || echo "❌ Pas de confettis trouvés!"
echo ""
# Vérifier framer-motion
grep "framer-motion" $FRONTEND_DIR/package.json || echo "❌ framer-motion non installé!"

echo ""
echo "📱 6. VÉRIFICATION ÉTAT REDUX"
echo "-----------------------------"
# Vérifier les slices
echo "Timer slice:"
ls -la $FRONTEND_DIR/src/store/slices/timerSlice* 2>/dev/null || echo "❌ timerSlice manquant!"
echo ""
echo "Task impact slice:"
ls -la $FRONTEND_DIR/src/store/slices/taskImpactSlice* 2>/dev/null || echo "❌ taskImpactSlice manquant!"

echo ""
echo "🔍 7. ANALYSE DES ERREURS CONSOLE"
echo "---------------------------------"
echo "Erreurs dans les logs backend:"
tail -20 $BACKEND_DIR/logs/*.log 2>/dev/null | grep -i "error" || echo "Pas de logs trouvés"

echo ""
echo "📋 RÉSUMÉ DES PROBLÈMES DÉTECTÉS"
echo "================================"
