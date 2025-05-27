#!/bin/bash
# Ajouter l'import api après l'import axios
sed -i '/import axios from/a\import api from '"'"'./api'"'"';' services/profitabilityService.ts

# Remplacer la ligne API_URL
sed -i 's#const API_URL = process.env.REACT_APP_API_URL || '"'"'http://localhost:5000/api'"'"';#const getApiUrl = () => api.defaults.baseURL || '"'"'http://localhost:5000/api'"'"';\nconst API_URL = getApiUrl();#' services/profitabilityService.ts
