/*
 * COMPOSANT DE LOGO CLIENT - frontend/src/components/Clients/ClientLogo.tsx
 *
 * Explication simple:
 * Ce composant affiche le logo d'un client ou, s'il n'a pas de logo, affiche
 * l'initiale de son nom sur un fond coloré. C'est comme une image de profil
 * qui peut changer de taille et de forme selon l'endroit où elle est utilisée.
 *
 * Explication technique:
 * Composant React fonctionnel TypeScript réutilisable qui gère l'affichage
 * conditionnel d'un logo client avec fallback élégant, prise en charge des
 * erreurs de chargement d'image, et style configurable.
 *
 * Où ce fichier est utilisé:
 * Intégré dans tous les composants qui nécessitent l'affichage visuel d'un client,
 * comme les listes de clients, les fiches client, les en-têtes de sections liées à un client.
 *
 * Connexions avec d'autres fichiers:
 * - Importé dans ClientCard, ClientList, ClientProfile, TaskCard, etc.
 * - Utilise les styles Tailwind CSS
 * - Consomme les données client provenant généralement de l'API backend
 */

// === Début : Import des dépendances ===
// Explication simple : On fait venir les outils dont on a besoin pour ce composant : React et le hook d'état.
// Explication technique : Importation de la bibliothèque React et du hook useState pour gérer l'état local du composant.
import React, { useState } from 'react';
// === Fin : Import des dépendances ===

// === Début : Définition de l'interface des propriétés ===
// Explication simple : On définit quelles informations notre composant a besoin pour fonctionner, comme une liste d'ingrédients pour une recette.
// Explication technique : Interface TypeScript qui définit le contrat de props du composant, spécifiant les types de données attendus, les propriétés requises et optionnelles.
interface ClientLogoProps {
  client: {
    _id?: string;
    name: string;
    logo?: string;
  };
  size?: 'small' | 'medium' | 'large';
  shape?: 'square' | 'rounded' | 'circle';
  className?: string;
}
// === Fin : Définition de l'interface des propriétés ===

// === Début : Déclaration du composant fonction ===
// Explication simple : C'est ici que commence notre composant qui va afficher le logo, avec des paramètres par défaut si on ne précise pas tout.
// Explication technique : Définition du composant fonctionnel React avec typage TypeScript, déstructuration des props et valeurs par défaut pour les propriétés optionnelles.
const ClientLogo: React.FC<ClientLogoProps> = ({ 
  client, 
  size = 'medium', 
  shape = 'rounded',
  className = '' 
}) => {
// === Fin : Déclaration du composant fonction ===

  // === Début : État pour la gestion des erreurs d'image ===
  // Explication simple : On crée un petit interrupteur qui s'active si l'image du logo ne charge pas correctement.
  // Explication technique : Utilisation du hook useState pour suivre l'état de chargement de l'image et permettre le fallback vers l'affichage de l'initiale en cas d'erreur.
  const [imageError, setImageError] = useState(false);
  // === Fin : État pour la gestion des erreurs d'image ===

  // === Début : Configuration des classes de taille ===
  // Explication simple : On définit les différentes tailles possibles pour notre logo, comme S, M, L pour des vêtements.
  // Explication technique : Objet contenant les classes Tailwind CSS correspondant aux différentes options de taille définies dans les props.
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };
  // === Fin : Configuration des classes de taille ===

  // === Début : Configuration des classes de forme ===
  // Explication simple : On définit les différentes formes possibles pour notre logo, comme carré, avec coins arrondis ou rond.
  // Explication technique : Objet contenant les classes Tailwind CSS correspondant aux différentes options de forme (border-radius) définies dans les props.
  const shapeClasses = {
    square: 'rounded-none',
    rounded: 'rounded-md',
    circle: 'rounded-full'
  };
  // === Fin : Configuration des classes de forme ===

  // === Début : Configuration des tailles de police ===
  // Explication simple : On définit les différentes tailles de texte à utiliser pour l'initiale selon la taille du logo.
  // Explication technique : Objet contenant les classes Tailwind CSS de taille de police correspondant aux différentes options de taille pour assurer la proportionnalité de l'initiale.
  const fontSize = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl'
  };
  // === Fin : Configuration des tailles de police ===

  // === Début : Vérification de l'existence du client ===
  // Explication simple : On vérifie si on a bien reçu un client, et si non, on n'affiche rien du tout.
  // Explication technique : Guard clause qui retourne null si la propriété client est null ou undefined, empêchant le rendu et les erreurs potentielles.
  if (!client) return null;
  // === Fin : Vérification de l'existence du client ===

  // === Début : Fonction de génération de couleur basée sur le nom ===
  // Explication simple : Cette fonction crée une couleur unique pour chaque client, basée sur son nom, pour que le même client ait toujours la même couleur.
  // Explication technique : Fonction utilitaire qui génère une classe de dégradé de couleur déterministe en fonction de la valeur ASCII cumulée des caractères du nom du client.
  const getColorFromName = (name: string) => {
    const colors = [
      'from-primary-500 to-primary-600',
      'from-cyan-500 to-cyan-600',
      'from-emerald-500 to-emerald-600',
      'from-amber-500 to-amber-600',
      'from-rose-500 to-rose-600',
      'from-indigo-500 to-indigo-600',
    ];
    
    // Utiliser la somme des valeurs ASCII pour avoir une couleur cohérente par client
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };
  // === Fin : Fonction de génération de couleur basée sur le nom ===

  // === Début : Rendu conditionnel pour l'initiale ===
  // Explication simple : Si le client n'a pas de logo ou si l'image n'a pas pu être chargée, on affiche la première lettre de son nom sur un fond coloré.
  // Explication technique : Condition de rendu qui affiche un div stylisé avec l'initiale du client et un arrière-plan coloré en cas d'absence de logo ou d'erreur de chargement d'image.
  if (!client.logo || imageError) {
    return (
      <div className={`${sizeClasses[size]} ${shapeClasses[shape]} bg-gradient-to-br ${getColorFromName(client.name)} text-white flex items-center justify-center ${className}`}>
        <span className={`font-bold ${fontSize[size]}`}>{client.name.charAt(0).toUpperCase()}</span>
      </div>
    );
  }
  // === Fin : Rendu conditionnel pour l'initiale ===

  // === Début : Rendu du logo client ===
  // Explication simple : Si le client a un logo, on l'affiche dans un joli cadre aux dimensions et à la forme demandées.
  // Explication technique : Rendu principal du composant qui affiche l'image du logo dans un conteneur stylistiquement cohérent, avec gestion d'erreur via onError et chargement paresseux pour l'optimisation.
  return (
    <div className={`${sizeClasses[size]} ${shapeClasses[shape]} overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center ${className}`}>
      <img 
        src={client.logo} 
        alt={`Logo de ${client.name}`}
        className="max-w-full max-h-full object-contain p-0.5"
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
  // === Fin : Rendu du logo client ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre composant disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres fichiers du projet.
export default ClientLogo;
// === Fin : Export du composant ===