/*
 * COMPOSANT D'UPLOAD D'AVATAR UTILISATEUR - frontend/src/components/UI/AvatarUploader.tsx
 *
 * Composant pour gérer l'upload et l'affichage de l'avatar utilisateur
 */

import React, { useState } from 'react';
import { uploadUserAvatar } from '../../services/api';
import { getAvatarUrl, getColorFromText } from '../../utils/imageUtils';

interface AvatarUploaderProps {
  currentAvatar?: string;
  userName: string;
  onAvatarChange: (avatarPath: string, file?: File) => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({ 
  currentAvatar,
  userName,
  onAvatarChange,
  size = 'large',
  className = ''
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(
    currentAvatar ? getAvatarUrl(currentAvatar) : ''
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Configuration des tailles
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-20 h-20',
    large: 'w-24 h-24'
  };

  const fontSizes = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-3xl'
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file && file.size > 5 * 1024 * 1024) {
      alert('Le fichier est trop grand. Taille maximale : 5MB');
      return;
    }
    
    if (file) {
      setIsLoading(true);
      
      try {
        console.log('Upload de l\'avatar:', file.name);
        
        const { path, filename, success } = await uploadUserAvatar(file);
        console.log('✅ Avatar upload réussi:', { path, filename, success });
        
        // Construire l'URL complète pour l'affichage
        const fullAvatarUrl = getAvatarUrl(path);
        console.log('🖼️ URL complète de l\'avatar:', fullAvatarUrl);
        
        // Mettre à jour la prévisualisation
        setPreviewUrl(fullAvatarUrl);
        
        // Notifier le parent avec le nom du fichier
        onAvatarChange(filename, file);
      } catch (error) {
        console.error('Erreur upload avatar:', error);
        alert('Erreur lors de l\'upload de l\'avatar');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRemoveAvatar = () => {
    setPreviewUrl('');
    onAvatarChange('');
  };

  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Photo de profil
      </label>
      
      <div className="flex items-center space-x-4">
        <div className="relative group">
          <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-600 relative cursor-pointer bg-white dark:bg-gray-800 shadow-xl`}>
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                onError={handleRemoveAvatar}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${getColorFromText(userName)} flex items-center justify-center text-white font-bold ${fontSizes[size]}`}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            
            {/* Overlay au survol */}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full">
              {isLoading ? (
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
            
            {/* Input file invisible */}
            <input
              type="file"
              accept="image/jpeg, image/png, image/gif, image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isLoading}
            />
          </div>

          {/* Bouton de suppression */}
          {previewUrl && !isLoading && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 z-20 transition-all duration-200 transform hover:scale-110"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="flex-1">
          <div className="relative">
            <button
              type="button"
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isLoading}
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Chargement...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {previewUrl ? 'Changer la photo' : 'Ajouter une photo'}
                </span>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Formats : JPG, PNG, GIF, WEBP • Max : 5MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default AvatarUploader;