// === Ce fichier fournit des outils pour gérer les images dans l'application === /workspaces/TaskManagerLatestVersion/frontend/src/services/imageService.ts
// Explication simple : Ce fichier contient des fonctions qui vérifient si une image est correcte et qui peuvent la rendre plus petite pour qu'elle se charge plus vite.
// Explication technique : Module de service utilitaire qui gère la validation et la compression d'images, principalement pour les images en base64 et les URL d'images.
// Utilisé dans : Les formulaires et composants qui manipulent des images, comme l'upload de logo client, les avatars utilisateurs, ou les pièces jointes de tâches.
// Connecté à : Aucune dépendance externe ou API, utilise uniquement l'API Canvas du navigateur pour la manipulation d'images.

/**
 * Service de gestion des images pour l'application
 */

// === Début : Fonction de validation d'URL d'image ===
// Explication simple : Cette fonction vérifie si l'adresse d'une image est correcte, comme quand tu vérifies si quelqu'un t'a donné une vraie adresse postale.
// Explication technique : Fonction utilitaire qui valide si une chaîne est une URL d'image valide, supportant à la fois les URLs HTTP/HTTPS et les chaînes de données base64 pour les images.
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
// === Fin : Fonction de validation d'URL d'image ===

// === Début : Fonction de compression d'image ===
// Explication simple : Cette fonction prend une grande image et la rend plus petite pour qu'elle se charge plus vite, comme quand tu compresses tes vêtements dans une valise.
// Explication technique : Fonction asynchrone qui utilise l'API Canvas pour redimensionner et compresser une image encodée en base64, avec contrôle de la largeur maximale et de la qualité de compression.
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
// === Fin : Fonction de compression d'image ===

// === Début : Exportation du service d'images ===
// Explication simple : Cette partie rend les fonctions disponibles pour que d'autres parties de l'application puissent les utiliser.
// Explication technique : Export par défaut qui expose un objet regroupant toutes les fonctions du service, facilitant leur importation et utilisation dans d'autres modules.
export default {
  isValidImageUrl,
  compressImage
};
// === Fin : Exportation du service d'images ===