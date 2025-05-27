#!/bin/bash

echo "=== Modification des fichiers restants ==="

# 1. imageUtils.ts
echo "1. Modification de imageUtils.ts..."
# Ajouter l'import en haut du fichier
sed -i '1i\import { getImageUrl as getImageUrlFromApi } from '"'"'../services/api'"'"';' utils/imageUtils.ts
# Remplacer le return
sed -i "s#return 'http://localhost:5000';#return getImageUrlFromApi('').replace('/api', '');#g" utils/imageUtils.ts

# 2. useTasks.ts
echo "2. Modification de useTasks.ts..."
# Vérifier si api est déjà importé, sinon l'ajouter après les imports React
if ! grep -q "import api from" hooks/useTasks.ts; then
  sed -i '/^import.*from.*react/a\import api from '"'"'../services/api'"'"';' hooks/useTasks.ts
fi
# Remplacer la fonction getApiUrl
sed -i "s#return process.env.REACT_APP_API_URL || 'http://localhost:5000';#return api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';#g" hooks/useTasks.ts

# 3. Pages
echo "3. Modification des pages..."

# ClientDetail.tsx
if ! grep -q "import api from" pages/ClientDetail.tsx; then
  sed -i '/^import.*React/a\import api from '"'"'../services/api'"'"';' pages/ClientDetail.tsx
fi
sed -i "s#return 'http://localhost:5000';#return api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';#g" pages/ClientDetail.tsx

# Register.tsx
if ! grep -q "import api from" pages/Register.tsx; then
  sed -i '/^import.*React/a\import api from '"'"'../services/api'"'"';' pages/Register.tsx
fi
# Attention au regex dans Register.tsx
sed -i "s#const apiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000')#const apiUrl = (api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000')#g" pages/Register.tsx

# TaskDetail.tsx
if ! grep -q "import api from" pages/TaskDetail.tsx; then
  sed -i '/^import.*React/a\import api from '"'"'../services/api'"'"';' pages/TaskDetail.tsx
fi
sed -i "s#process.env.REACT_APP_API_URL || 'http://localhost:5000'#api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000'#g" pages/TaskDetail.tsx

# TimerPopup.tsx
if ! grep -q "import api from" components/timer/TimerPopup.tsx; then
  sed -i '/^import.*React/a\import api from '"'"'../../services/api'"'"';' components/timer/TimerPopup.tsx
fi
sed -i "s#return 'http://localhost:5000';#return api.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000';#g" components/timer/TimerPopup.tsx

echo "=== Fichiers modifiés ==="
