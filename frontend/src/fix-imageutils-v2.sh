#!/bin/bash

# Remplacer getLogoUrl pour utiliser getImageUrl de api.ts
sed -i '/export const getLogoUrl/,/^};$/c\
export const getLogoUrl = (logoPath?: string): string => {\
  return getImageUrlFromApi(logoPath);\
};' utils/imageUtils.ts

# Remplacer getAvatarUrl pour utiliser getImageUrl de api.ts
sed -i '/export const getAvatarUrl/,/^};$/c\
export const getAvatarUrl = (avatarPath?: string): string => {\
  return getImageUrlFromApi(avatarPath);\
};' utils/imageUtils.ts

echo "✅ Fonctions modifiées pour utiliser getImageUrl de api.ts"
