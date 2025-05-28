#!/bin/bash

echo "🔄 VÉRIFICATION DU FLUX DE COMPLÉTION DE TÂCHE"
echo "=============================================="
echo ""

# Trouver le bon contrôleur
TASK_CONTROLLER=$(find backend/controllers -name "*ask*.js" | head -1)
echo "📁 Contrôleur trouvé: $TASK_CONTROLLER"
echo ""

if [ -f "$TASK_CONTROLLER" ]; then
    echo "📌 1. IMPORTS DANS LE CONTRÔLEUR DE TÂCHES"
    echo "-------------------------------------------"
    grep -n "require" "$TASK_CONTROLLER" | head -10
    
    echo ""
    echo "🎯 2. FONCTION completeTask"
    echo "---------------------------"
    grep -A 30 "completeTask" "$TASK_CONTROLLER" | head -40
    
    echo ""
    echo "🎮 3. INTÉGRATION GAMIFICATION"
    echo "-------------------------------"
    grep -n "points\|experience\|badge\|Activity\|gamification" "$TASK_CONTROLLER"
fi

echo ""
echo "🖼️ 4. COMPOSANTS UI MANQUANTS"
echo "------------------------------"
echo "Recherche TimerPopup:"
find frontend/src -name "*Timer*" -type f | grep -v ".css" | sort

echo ""
echo "🔊 5. DÉCLENCHEURS DE SONS/EFFETS"
echo "---------------------------------"
echo "Dans les pages de tâches:"
grep -r "soundService\|confetti" frontend/src/pages/*ask* 2>/dev/null || echo "❌ Pas de sons dans les pages de tâches"

echo ""
echo "Dans les composants de tâches:"
grep -r "soundService\|confetti" frontend/src/components/*ask* 2>/dev/null || echo "❌ Pas de sons dans les composants"

