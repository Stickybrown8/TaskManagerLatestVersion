import { useState, useEffect } from 'react';
import { isValidImageUrl } from '../services/imageService';

interface UseImageProps {
  src: string | undefined;
  fallback?: string;
}

export const useImage = ({ src, fallback }: UseImageProps) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(
    src && isValidImageUrl(src) ? src : fallback
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

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

  return { imgSrc, isLoading, error };
};