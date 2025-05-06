import React, { useState } from 'react';

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

  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  const shapeClasses = {
    square: 'rounded-none',
    rounded: 'rounded-md',
    circle: 'rounded-full'
  };

  const fontSize = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl'
  };

  if (!client) return null;

  // Fonction pour générer une couleur de fond basée sur le nom du client
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

  // Afficher l'initiale si pas de logo ou erreur au chargement de l'image
  if (!client.logo || imageError) {
    return (
      <div className={`${sizeClasses[size]} ${shapeClasses[shape]} bg-gradient-to-br ${getColorFromName(client.name)} text-white flex items-center justify-center ${className}`}>
        <span className={`font-bold ${fontSize[size]}`}>{client.name.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

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
};

export default ClientLogo;