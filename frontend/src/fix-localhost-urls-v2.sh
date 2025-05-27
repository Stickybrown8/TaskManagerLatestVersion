#!/bin/bash

echo "=== Correction des URLs localhost:5000 ==="

# 1. Corriger les services (profitabilityService, timerService, objectivesService, taskImpactService)
echo "1. Correction des services..."
for file in services/profitabilityService.ts services/timerService.ts services/objectivesService.ts services/taskImpactService.ts; do
  if [ -f "$file" ]; then
    echo "   Modification de $file"
    # Remplacer la ligne API_URL
    sed -i "s|const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';|import api from './api';\nconst getApiUrl = () => api.defaults.baseURL || 'http://localhost:5000/api';\nconst API_URL = getApiUrl();|g" "$file"
  fi
done

# 2. Corriger imageUtils.ts
echo "2. Correction de imageUtils.ts..."
if [ -f "utils/imageUtils.ts" ]; then
  echo "   Modification de utils/imageUtils.ts"
  # Ajouter l'import et modifier le return
  sed -i "1i import { getImageUrl as getImageUrlFromApi } from '../services/api';" utils/imageUtils.ts
  sed -i "s|return 'http://localhost:5000';|return getImageUrlFromApi('');|g" utils/imageUtils.ts
fi

# 3. Corriger useTasks.ts
echo "3. Correction de hooks/useTasks.ts..."
if [ -f "hooks/useTasks.ts" ]; then
  echo "   Modification de hooks/useTasks.ts"
  sed -i "s|return process.env.REACT_APP_API_URL || 'http://localhost:5000';|return api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';|g" hooks/useTasks.ts
fi

# 4. Corriger les pages
echo "4. Correction des pages..."
# ClientDetail.tsx
if [ -f "pages/ClientDetail.tsx" ]; then
  echo "   Modification de pages/ClientDetail.tsx"
  sed -i "s|return 'http://localhost:5000';|return api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';|g" pages/ClientDetail.tsx
fi

# Register.tsx
if [ -f "pages/Register.tsx" ]; then
  echo "   Modification de pages/Register.tsx"
  sed -i "s|const apiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\\\/$/, '');|const apiUrl = (api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000').replace(/\\\/$/, '');|g" pages/Register.tsx
fi

# TaskDetail.tsx
if [ -f "pages/TaskDetail.tsx" ]; then
  echo "   Modification de pages/TaskDetail.tsx"
  sed -i "s|process.env.REACT_APP_API_URL || 'http://localhost:5000'|api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000'|g" pages/TaskDetail.tsx
fi

# TimerPopup.tsx  
if [ -f "components/timer/TimerPopup.tsx" ]; then
  echo "   Modification de components/timer/TimerPopup.tsx"
  sed -i "s|return 'http://localhost:5000';|return api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';|g" components/timer/TimerPopup.tsx
fi

echo "=== Corrections terminées ==="
