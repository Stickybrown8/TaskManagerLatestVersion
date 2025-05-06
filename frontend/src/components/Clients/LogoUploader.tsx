import React, { useState } from 'react';
import { compressImage } from '../../services/imageService';

interface LogoUploaderProps {
  currentLogo?: string;
  onLogoChange: (logo: string, file?: File) => void;
  className?: string;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ 
  currentLogo,
  onLogoChange,
  className = ''
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(currentLogo || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Taille maximale: 2MB');
        return;
      }
      
      // Vérifier le type du fichier
      if (!file.type.match('image/(jpeg|png|gif|webp|svg+xml)')) {
        alert('Format de fichier non supporté. Utilisez JPG, PNG, GIF, WEBP ou SVG');
        return;
      }
      
      setIsLoading(true);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const result = reader.result as string;
          
          // Compresser l'image pour réduire sa taille
          const compressed = await compressImage(result);
          
          setPreviewUrl(compressed);
          onLogoChange(compressed, file);
        } catch (error) {
          console.error('Erreur lors de la compression:', error);
          alert('Erreur lors du traitement de l\'image');
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        alert('Erreur lors de la lecture du fichier');
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveLogo = () => {
    setPreviewUrl('');
    onLogoChange('');
  };

  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Logo du client
      </label>
      
      <div className="flex items-center space-x-4">
        {previewUrl ? (
          <div className="relative">
            <div className="w-24 h-24 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden bg-white dark:bg-gray-700 flex items-center justify-center">
              <img 
                src={previewUrl} 
                alt="Aperçu du logo" 
                className="max-w-full max-h-full object-contain"
                onError={handleRemoveLogo}
              />
            </div>
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md flex items-center justify-center bg-gray-50 dark:bg-gray-800">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        <div className="flex-1">
          <div className="relative">
            <input
              type="file"
              id="logo"
              name="logo"
              accept="image/jpeg, image/png, image/gif, image/webp, image/svg+xml"
              onChange={handleFileChange}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
              disabled={isLoading}
            />
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Chargement...
                </span>
              ) : (
                <>
                  {previewUrl ? 'Changer le logo' : 'Ajouter un logo'}
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Formats acceptés: JPG, PNG, GIF, WEBP, SVG. Taille max: 2MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogoUploader;