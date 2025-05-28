#!/bin/bash
# Script pour corriger les appels API dans ClientDetail.tsx

# Faire une sauvegarde
cp ClientDetail.tsx ClientDetail.tsx.backup

# 1. Corriger l'appel profitabilité
sed -i '173s|const profitabilityResponse = await fetch.*|const profitabilityResponse = await api.get("/profitability");|' ClientDetail.tsx
sed -i '174,176d' ClientDetail.tsx

sed -i 's/if (profitabilityResponse.ok)/if (profitabilityResponse.data)/' ClientDetail.tsx
sed -i 's/const profitabilityData = await profitabilityResponse.json()/const profitabilityData = profitabilityResponse.data/' ClientDetail.tsx

# 2. Corriger les appels axios
sed -i 's|await axios.put(`${API_URL}/api/clients/${id}`|await api.put(`/clients/${id}`|' ClientDetail.tsx
sed -i 's|await axios.post(`${API_URL}/api/profitability/client/${id}`|await api.post(`/profitability/client/${id}`|' ClientDetail.tsx
sed -i 's|await axios.delete(`${API_URL}/api/clients/${id}`|await api.delete(`/clients/${id}`|' ClientDetail.tsx

# 3. Nettoyer les headers
perl -i -0pe 's/, \s*{\s*headers:\s*{\s*[^}]*}\s*}//gs' ClientDetail.tsx

echo "✅ Corrections appliquées !"
