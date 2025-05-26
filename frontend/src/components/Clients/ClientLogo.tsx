/*
 * COMPOSANT DE LOGO CLIENT - frontend/src/components/Clients/ClientLogo.tsx
 *
 * Version finale avec gestion d'erreurs et fallback intelligent
 */

import React, { useState } from 'react';
import { getLogoUrl, getColorFromText } from '../../utils/imageUtils';

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

const ClientLogo: React.FC<ClientLogoProps> = ({ 
  client, 
  size = 'medium', 
  shape = 'rounded',
  className = '' 
}) => {
  const [imageError, setImageError] = useState(false);

  // Configuration des classes de taille
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  // Configuration des classes de forme
  const shapeClasses = {
    square: 'rounded-none',
    rounded: 'rounded-md',
    circle: 'rounded-full'
  };

  // Configuration des tailles de police
  const fontSize = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl'
  };

  if (!client) return null;

  // Si pas de logo ou erreur de chargement, afficher l'initiale
  if (!client.logo || imageError) {
    return (
      <div className={`${sizeClasses[size]} ${shapeClasses[shape]} bg-gradient-to-br ${getColorFromText(client.name)} text-white flex items-center justify-center shadow-lg ring-2 ring-white/20 ${className}`}>
        <span className={`font-bold ${fontSize[size]}`}>
          {client.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  // Construire l'URL du logo
  const logoUrl = getLogoUrl(client.logo);

  return (
    <div className={`${sizeClasses[size]} ${shapeClasses[shape]} overflow-hidden shadow-lg ring-2 ring-white/20 ${className}`}>
      <img 
        src={logoUrl} 
        alt={`Logo de ${client.name}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          console.log('❌ Erreur chargement logo:', logoUrl);
          setImageError(true);
        }}
      />
    </div>
  );
};

export default ClientLogo;