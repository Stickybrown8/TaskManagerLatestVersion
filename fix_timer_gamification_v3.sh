#!/bin/bash
echo "🎮 Ajout de la gamification dans TimerPopup - Version 3"

FILE="frontend/src/components/timer/TimerPopup.tsx"
BACKUP="${FILE}.before_gamification_$(date +%Y%m%d_%H%M%S)"

# Backup
cp "$FILE" "$BACKUP"
echo "✅ Backup créé: $BACKUP"

# 1. Remplacer les lignes 344-357 (tout l'appel fetch) par handleCompleteTask
echo "📝 Remplacement de l'appel fetch par handleCompleteTask..."
sed -i '344,357c\          await handleCompleteTask(selectedTaskId);' "$FILE"

# 2. Commenter "if (response.ok) {"
echo "💬 Commentaire de response.ok..."
sed -i '358s/if (response\.ok) {/\/\/ Effets gérés par handleCompleteTask/' "$FILE"

# 3. Supprimer "const data = await response.json();"
echo "🧹 Suppression de response.json()..."
sed -i '/const data = await response\.json();/d' "$FILE"

# 4. Remplacer data.rewards
echo "🔄 Simplification des rewards..."
sed -i 's/if (data\.rewards)/if (true)/' "$FILE"
sed -i 's/${data\.rewards\.points}/10/' "$FILE"
sed -i 's/${data\.rewards\.experience}/50/' "$FILE"

# 5. Supprimer l'accolade fermante ligne 388
echo "🔧 Suppression de l'accolade fermante en trop ligne 388..."
sed -i '388d' "$FILE"

# 6. Ajouter ConfettiEffect avant le </> (ligne 1235)
echo "🎊 Ajout du ConfettiEffect ligne 1235..."
sed -i '1235i\      <ConfettiEffect show={showConfetti} />' "$FILE"

echo -e "\n✅ Modifications terminées!"

# Vérifications
echo -e "\n📋 Vérifications finales:"

echo "1. handleCompleteTask:"
grep -n "await handleCompleteTask" "$FILE"

echo -e "\n2. ConfettiEffect:"
grep -n "ConfettiEffect show=" "$FILE"

echo -e "\n3. Structure modifiée (lignes 344-365):"
sed -n '344,365p' "$FILE"

echo -e "\n4. Fin du fichier avec ConfettiEffect:"
tail -10 "$FILE"

