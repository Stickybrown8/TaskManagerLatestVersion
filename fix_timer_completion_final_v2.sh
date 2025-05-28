#!/bin/bash
echo "🔧 Correction finale de TimerPopup pour ajouter sons et confettis"

FILE="frontend/src/components/timer/TimerPopup.tsx"
BACKUP="${FILE}.backup_$(date +%Y%m%d_%H%M%S)"

# Backup
cp "$FILE" "$BACKUP"
echo "✅ Backup créé: $BACKUP"

# 1. Remplacer l'appel fetch (lignes 344-357) par handleCompleteTask
echo "📝 Remplacement de l'appel API..."

# Créer un fichier temporaire avec le remplacement
cat > /tmp/timer_replacement.txt << 'REPLACEMENT'
          await handleCompleteTask(selectedTaskId);
          
          // Si le timer a duré plus de 3 minutes, donner des points bonus
REPLACEMENT

# Remplacer les lignes 344-357 (tout l'appel fetch)
sed -i '344,357d' "$FILE"
sed -i '343r /tmp/timer_replacement.txt' "$FILE"

# 2. Maintenant il faut gérer le bloc après (response.ok et data)
# Supprimer "if (response.ok) {" et "const data = await response.json();"
sed -i '/if (response\.ok) {/d' "$FILE"
sed -i '/const data = await response\.json();/d' "$FILE"

# 3. Remplacer les références à data.rewards
echo "🔄 Mise à jour des références aux rewards..."
sed -i 's/if (data\.rewards) {/\/\/ Rewards gérés par handleCompleteTask\n            if (true) {/' "$FILE"
sed -i 's/${data\.rewards\.points}/10/' "$FILE"
sed -i 's/${data\.rewards\.experience}/50/' "$FILE"

# 4. Supprimer une accolade fermante en trop (celle du if response.ok)
# Chercher après le bloc de rewards et supprimer le } correspondant
REWARD_LINE=$(grep -n "Tâche terminée!" "$FILE" | tail -1 | cut -d: -f1)
if [ -n "$REWARD_LINE" ]; then
    # Chercher le prochain } seul sur une ligne après les rewards
    CLOSE_LINE=$(sed -n "$((REWARD_LINE+5)),\$p" "$FILE" | grep -n "^[[:space:]]*}[[:space:]]*$" | head -1 | cut -d: -f1)
    if [ -n "$CLOSE_LINE" ]; then
        ACTUAL_LINE=$((REWARD_LINE + 5 + CLOSE_LINE - 1))
        sed -i "${ACTUAL_LINE}d" "$FILE"
    fi
fi

# 5. Ajouter ConfettiEffect avant le dernier </AnimatePresence>
echo "🎊 Ajout du ConfettiEffect..."
sed -i '1234i\      <ConfettiEffect show={showConfetti} />' "$FILE"

echo -e "\n✅ Modifications terminées!"

# Vérifications
echo -e "\n📋 Vérifications finales:"
echo "1. handleCompleteTask:"
grep -n -C2 "handleCompleteTask" "$FILE" | head -10

echo -e "\n2. ConfettiEffect:"
grep -n "ConfettiEffect show=" "$FILE"

echo -e "\n3. Structure du code modifié (autour de la ligne 345):"
sed -n '340,370p' "$FILE"

