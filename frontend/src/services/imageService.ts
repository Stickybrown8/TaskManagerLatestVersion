/**
 * Service de gestion des images pour l'application
 */

/**
 * Vérifie si une URL d'image est valide
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Vérifie si c'est une URL data
  if (url.startsWith('data:image/')) {
    return true;
  }
  
  // Vérifie si c'est une URL HTTP
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (e) {
    return false;
  }
};

/**
 * Compresse une image base64 pour réduire sa taille
 */
export const compressImage = async (base64: string, maxWidth = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // Redimensionnement si nécessaire
      if (width > maxWidth) {
        height = Math.floor(height * (maxWidth / width));
        width = maxWidth;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 0.8 = 80% de qualité, bon compromis taille/qualité
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    
    img.onerror = () => {
      reject(new Error('Impossible de charger l\'image'));
    };
    
    img.src = base64;
  });
};

export default {
  isValidImageUrl,
  compressImage
};