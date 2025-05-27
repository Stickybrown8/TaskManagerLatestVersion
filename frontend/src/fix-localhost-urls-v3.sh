#!/bin/bash

echo "=== Correction des URLs localhost:5000 ==="

# 1. Corriger les services
echo "1. Correction des services..."
for file in services/profitabilityService.ts services/timerService.ts services/objectivesService.ts services/taskImpactService.ts; do
  if [ -f "$file" ]; then
    echo "   Modification de $file"
    # Vérifier si l'import existe déjà
    if ! grep -q "import api from './api'" "$file"; then
      # Ajouter l'import en haut du fichier après les autres imports
      sed -i '/^import/a\import api from '"'"'./api'"'"';' "$file"
    fi
    # Remplacer la ligne API_URL
    sed -i "s#const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';#const getApiUrl = () => api.defaults.baseURL || 'http://localhost:5000/api';\nconst API_URL = getApiUrl();#g" "$file"
  fi
done

# 2. Corriger imageUtils.ts
echo "2. Correction de imageUtils.ts..."
if [ -f "utils/imageUtils.ts" ]; then
  echo "   Modification de utils/imageUtils.ts"
  # Vérifier si l'import existe déjà
  if ! grep -q "getImageUrl as getImageUrlFromApi" "utils/imageUtils.ts"; then
    sed -i "1i import { getImageUrl as getImageUrlFromApi } from '../services/api';" utils/imageUtils.ts
  fi
  sed -i "s#return 'http://localhost:5000';#return getImageUrlFromApi('').replace('/api', '');#g" utils/imageUtils.ts
fi

# 3. Corriger useTasks.ts
echo "3. Correction de hooks/useTasks.ts..."
if [ -f "hooks/useTasks.ts" ]; then
  echo "   Modification de hooks/useTasks.ts"
  # Vérifier si l'import api existe
  if ! grep -q "import api" "hooks/useTasks.ts"; then
    sed -i '/^import/a\import api from '"'"'../services/api'"'"';' "hooks/useTasks.ts"
  fi
  sed -i "s#return process.env.REACT_APP_API_URL || 'http://localhost:5000';#return api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';#g" hooks/useTasks.ts
fi

# 4. Corriger les pages
echo "4. Correction des pages..."

# ClientDetail.tsx
if [ -f "pages/ClientDetail.tsx" ]; then
  echo "   Modification de pages/ClientDetail.tsx"
  if ! grep -q "import api" "pages/ClientDetail.tsx"; then
    sed -i '/^import/a\import api from '"'"'../services/api'"'"';' "pages/ClientDetail.tsx"
  fi
  sed -i "s#return 'http://localhost:5000';#return api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';#g" pages/ClientDetail.tsx
fi

# Register.tsx
if [ -f "pages/Register.tsx" ]; then
  echo "   Modification de pages/Register.tsx"
  if ! grep -q "import api" "pages/Register.tsx"; then
    sed -i '/^import/a\import api from '"'"'../services/api'"'"';' "pages/Register.tsx"
  fi
  sed -i "s#const apiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\\\\\/$/, '');#const apiUrl = (api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000').replace(/\\\/$/, '');#g" pages/Register.tsx
fi

# TaskDetail.tsx
if [ -f "pages/TaskDetail.tsx" ]; then
  echo "   Modification de pages/TaskDetail.tsx"
  if ! grep -q "import api" "pages/TaskDetail.tsx"; then
    sed -i '/^import/a\import api from '"'"'../services/api'"'"';' "pages/TaskDetail.tsx"
  fi
  sed -i "s#process.env.REACT_APP_API_URL || 'http://localhost:5000'#api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000'#g" pages/TaskDetail.tsx
fi

# TimerPopup.tsx
if [ -f "components/timer/TimerPopup.tsx" ]; then
  echo "   Modification de components/timer/TimerPopup.tsx"
  if ! grep -q "import api" "components/timer/TimerPopup.tsx"; then
    sed -i '/^import/a\import api from '"'"'../../services/api'"'"';' "components/timer/TimerPopup.tsx"
  fi
  sed -i "s#return 'http://localhost:5000';#return api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';#g" components/timer/TimerPopup.tsx
fi

echo "=== Corrections terminées ==="
