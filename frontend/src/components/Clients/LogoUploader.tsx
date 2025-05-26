import React, { useState } from 'react';
import { uploadLogo } from '../../services/api';
import { getLogoUrl } from '../../utils/imageUtils';

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
  const [previewUrl, setPreviewUrl] = useState<string>(
    currentLogo ? getLogoUrl(currentLogo) : ''
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file && file.size > 5 * 1024 * 1024) {
      alert('Le fichier est trop grand. Taille maximale : 5MB');
      return;
    }
    
    if (file) {
      setIsLoading(true);
      
      try {
        console.log('Upload du fichier:', file.name);
        const { path, filename, success } = await uploadLogo(file);
        console.log('✅ Upload réussi:', { path, filename, success });

        const fullLogoUrl = getLogoUrl(path);
        console.log('🖼️ URL complète du logo:', fullLogoUrl);

        setPreviewUrl(fullLogoUrl);
        onLogoChange(filename, file);
      } catch (error) {
        console.error('Erreur upload logo:', error);
        alert('Erreur lors de l\'upload du logo');
      } finally {
        setIsLoading(false);
      }
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
          <div className="relative group">
            <div className="w-24 h-24 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-700 flex items-center justify-center shadow-lg">
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
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-110 opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        <div className="flex-1">
          <div className="relative">
            <input
              type="file"
              accept="image/jpeg, image/png, image/gif, image/webp, image/svg+xml"
              onChange={handleFileChange}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
              disabled={isLoading}
            />
            <button
              type="button"
              className="w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Chargement...' : (previewUrl ? 'Changer le logo' : 'Ajouter un logo')}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            JPG, PNG, GIF, WEBP, SVG • Max : 5MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default LogoUploader;