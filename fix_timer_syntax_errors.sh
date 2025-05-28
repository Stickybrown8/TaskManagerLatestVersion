#!/bin/bash
echo "🚨 Correction urgente des erreurs de syntaxe dans TimerPopup"

FILE="frontend/src/components/timer/TimerPopup.tsx"
BACKUP="${FILE}.syntax_fix_backup_$(date +%Y%m%d_%H%M%S)"

# Backup
cp "$FILE" "$BACKUP"
echo "✅ Backup créé: $BACKUP"

# Montrer la zone problématique
echo -e "\n📍 Zone problématique actuelle:"
sed -n '340,350p' "$FILE"

# Il semble que le bloc try-catch soit cassé. Restaurons depuis un backup fonctionnel
echo -e "\n🔧 Recherche d'un backup fonctionnel..."
LAST_GOOD_BACKUP=$(ls -t frontend/src/components/timer/TimerPopup.tsx.backup_* 2>/dev/null | head -1)

if [ -n "$LAST_GOOD_BACKUP" ]; then
    echo "✅ Backup trouvé: $LAST_GOOD_BACKUP"
    echo "Restauration en cours..."
    cp "$LAST_GOOD_BACKUP" "$FILE"
    echo "✅ Fichier restauré!"
else
    echo "❌ Aucun backup trouvé!"
fi

