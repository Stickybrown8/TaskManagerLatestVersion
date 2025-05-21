/*
 * GESTIONNAIRE DE CHARGEMENT D'IMAGES - frontend/src/hooks/useImage.ts
 *
 * Explication simple:
 * Ce fichier crée un outil spécial qui aide à afficher des images dans l'application.
 * Il vérifie si l'image peut être chargée correctement et, si quelque chose ne va pas
 * (comme un lien cassé), il affiche automatiquement une image de remplacement. C'est comme
 * avoir un plan B quand la photo que tu veux montrer à tes amis n'est pas disponible.
 *
 * Explication technique:
 * Hook personnalisé React qui gère le chargement asynchrone des images avec gestion
 * des erreurs et fallback. Il encapsule la logique de validation d'URL, le cycle de
 * chargement et les états d'erreur pour faciliter l'affichage conditionnel des images.
 *
 * Où ce fichier est utilisé:
 * Importé dans les composants qui affichent des images provenant de sources externes
 * ou potentiellement non fiables, comme les avatars utilisateurs, les images de produits
 * ou les miniatures de projets.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise la fonction isValidImageUrl depuis '../services/imageService'
 * - Consommé par divers composants d'interface utilisateur qui affichent des images
 * - S'appuie sur les hooks standards de React (useState, useEffect)
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend les outils dont on a besoin pour faire fonctionner notre vérificateur d'images, comme quand tu prends une loupe et une lampe avant d'explorer quelque chose.
// Explication technique : Importation des hooks React nécessaires pour la gestion d'état et les effets de cycle de vie, ainsi que de la fonction utilitaire pour valider les URLs d'images.
import { useState, useEffect } from 'react';
import { isValidImageUrl } from '../services/imageService';
// === Fin : Importation des dépendances ===

// === Début : Définition de l'interface des props ===
// Explication simple : On explique à l'ordinateur ce que notre outil a besoin pour fonctionner : l'adresse de l'image qu'on veut montrer et une image de secours au cas où.
// Explication technique : Déclaration d'une interface TypeScript qui définit le contrat des paramètres attendus par le hook, avec typage explicite et optionalité pour le fallback.
interface UseImageProps {
  src: string | undefined;
  fallback?: string;
}
// === Fin : Définition de l'interface des props ===

// === Début : Définition du hook personnalisé useImage ===
// Explication simple : C'est notre outil principal qui va s'occuper de vérifier si une image fonctionne et de prévoir un plan B si elle ne marche pas.
// Explication technique : Déclaration du hook personnalisé qui accepte les props typées selon l'interface et encapsule la logique de gestion des images.
export const useImage = ({ src, fallback }: UseImageProps) => {
  // === Début : Initialisation des états ===
  // Explication simple : On prépare trois informations importantes à suivre : l'adresse de l'image à afficher, si elle est en train de se charger, et s'il y a eu un problème.
  // Explication technique : Configuration des états locaux via useState pour gérer la source de l'image, l'état de chargement et les erreurs potentielles, avec initialisation conditionnelle basée sur la validité de l'URL source.
  const [imgSrc, setImgSrc] = useState<string | undefined>(
    src && isValidImageUrl(src) ? src : fallback
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  // === Fin : Initialisation des états ===

  // === Début : Effet de chargement de l'image ===
  // Explication simple : Cette partie vérifie si l'image peut être affichée correctement. Si oui, elle la montre; sinon, elle utilise l'image de secours. C'est comme essayer d'ouvrir une porte et, si elle est fermée, utiliser une autre entrée.
  // Explication technique : Hook useEffect qui gère le cycle de vie du chargement de l'image, avec validation préliminaire de l'URL, création d'un objet Image pour le préchargement, et configuration des gestionnaires d'événements pour les cas de succès et d'erreur.
  useEffect(() => {
    if (!src || !isValidImageUrl(src)) {
      setImgSrc(fallback);
      setIsLoading(false);
      setError(true);
      return;
    }

    const img = new Image();
    img.src = src;

    const handleLoad = () => {
      setImgSrc(src);
      setIsLoading(false);
      setError(false);
    };

    const handleError = () => {
      setImgSrc(fallback);
      setIsLoading(false);
      setError(true);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [src, fallback]);
  // === Fin : Effet de chargement de l'image ===

  // === Début : Retour des résultats du hook ===
  // Explication simple : Notre outil donne trois informations importantes : l'image à afficher (celle d'origine ou celle de secours), si elle est encore en train de se charger, et s'il y a eu un problème.
  // Explication technique : Retour d'un objet contenant les états nécessaires pour que le composant consommateur puisse gérer l'affichage conditionnel de l'image et les états de chargement/erreur.
  return { imgSrc, isLoading, error };
  // === Fin : Retour des résultats du hook ===
};