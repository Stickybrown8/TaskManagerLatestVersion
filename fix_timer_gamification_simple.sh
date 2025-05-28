#!/bin/bash
echo "🎮 Ajout simple de la gamification dans TimerPopup"

FILE="frontend/src/components/timer/TimerPopup.tsx"
BACKUP="${FILE}.gamification_$(date +%Y%m%d_%H%M%S)"

# Backup
cp "$FILE" "$BACKUP"
echo "✅ Backup créé: $BACKUP"

# 1. Remplacer TOUT le bloc d'appel API (lignes 344-359) par notre code
echo "📝 Remplacement du bloc complet..."
cat > /tmp/timer_replacement.txt << 'REPLACEMENT'
          await handleCompleteTask(selectedTaskId);
          
          // Effets de gamification gérés par handleCompleteTask
          if (timerDuration > 180) {
            const points = Math.floor(timerDuration / 60);
            const multiplier = selectedTask?.isHighImpact ? 2 : 1;
            await addExperience(points * multiplier, `Timer: ${formatDuration(timerDuration)}`);
          }
          
          // Notification de succès
          dispatch(addNotification({
            message: '🎉 Tâche terminée avec succès!',
            type: 'success'
          }));
REPLACEMENT

# Remplacer les lignes 344-359 par notre nouveau code
sed -i '344,359d' "$FILE"
sed -i '343r /tmp/timer_replacement.txt' "$FILE"

# 2. Enlever les lignes qui dépendent de data.rewards (360-375)
echo "🧹 Nettoyage des dépendances..."
# On garde juste le code de réinitialisation
sed -i '360,375c\          \n          setIsRunning(false);\n          setSelectedTaskId('\'\'''\'\''');\n          setSelectedTask(null);\n          setTimerDuration(0);\n          setTimerId(null);\n          dispatch(setRunningTimer(null));\n          \n          refreshTasks();\n          fetchClientsAndTasks();' "$FILE"

# 3. Supprimer l'accolade en trop
echo "🔧 Ajustement de la structure..."
# Chercher et supprimer le } isolé après fetchClientsAndTasks
sed -i '/fetchClientsAndTasks();/{n;/^[[:space:]]*}[[:space:]]*$/d;}' "$FILE"

# 4. Ajouter ConfettiEffect
echo "🎊 Ajout du ConfettiEffect..."
# Trouver le dernier </> et ajouter juste avant
LAST_LINE=$(grep -n "</>" "$FILE" | tail -1 | cut -d: -f1)
if [ -n "$LAST_LINE" ]; then
    sed -i "${LAST_LINE}i\      <ConfettiEffect show={showConfetti} />" "$FILE"
fi

echo -e "\n✅ Modifications terminées!"

# Vérifications
echo -e "\n📋 Vérifications:"
echo "1. handleCompleteTask présent:"
grep -n "await handleCompleteTask" "$FILE"

echo -e "\n2. Plus de 'response' non géré:"
grep -n "response\." "$FILE" | grep -v "231:" | grep -v "271:" | grep -v "502:" || echo "✅ Aucune référence à response dans handleFinishTask"

echo -e "\n3. ConfettiEffect ajouté:"
grep -n "ConfettiEffect show=" "$FILE"

echo -e "\n4. Structure finale (lignes 344-370):"
sed -n '344,370p' "$FILE"

