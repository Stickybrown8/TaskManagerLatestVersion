#!/bin/bash

echo "=== Modification des services restants ==="

# timerService.ts
echo "1. Modification de timerService.ts..."
sed -i '/import axios from/a\import api from '"'"'./api'"'"';' services/timerService.ts
sed -i 's#const API_URL = process.env.REACT_APP_API_URL || '"'"'http://localhost:5000/api'"'"';#const getApiUrl = () => api.defaults.baseURL || '"'"'http://localhost:5000/api'"'"';\nconst API_URL = getApiUrl();#' services/timerService.ts

# objectivesService.ts
echo "2. Modification de objectivesService.ts..."
sed -i '/import axios from/a\import api from '"'"'./api'"'"';' services/objectivesService.ts
sed -i 's#const API_URL = process.env.REACT_APP_API_URL || '"'"'http://localhost:5000/api'"'"';#const getApiUrl = () => api.defaults.baseURL || '"'"'http://localhost:5000/api'"'"';\nconst API_URL = getApiUrl();#' services/objectivesService.ts

# taskImpactService.ts
echo "3. Modification de taskImpactService.ts..."
sed -i '/import axios from/a\import api from '"'"'./api'"'"';' services/taskImpactService.ts
sed -i 's#const API_URL = process.env.REACT_APP_API_URL || '"'"'http://localhost:5000/api'"'"';#const getApiUrl = () => api.defaults.baseURL || '"'"'http://localhost:5000/api'"'"';\nconst API_URL = getApiUrl();#' services/taskImpactService.ts

echo "=== Services modifiés ==="
