import React from 'react';

interface ClientLogoProps {
  client: {
    _id?: string;
    name: string;
    logo?: string;
  };
  size?: 'small' | 'medium' | 'large';
}

const ClientLogo: React.FC<ClientLogoProps> = ({ client, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  const fontSize = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl'
  };

  if (!client) return null;

  return client.logo ? (
    <div className={`${sizeClasses[size]} rounded-md overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}>
      <img 
        src={client.logo} 
        alt={`Logo de ${client.name}`} 
        className="max-w-full max-h-full object-contain"
      />
    </div>
  ) : (
    <div className={`${sizeClasses[size]} rounded-md bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center`}>
      <span className={`font-bold ${fontSize[size]}`}>{client.name.charAt(0).toUpperCase()}</span>
    </div>
  );
};

export default ClientLogo;