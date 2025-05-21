import React, { useEffect, useState } from 'react';
import api from '../services/api'; // Corrected import path for the api instance

const TestApi: React.FC = () => {
  const [message, setMessage] = useState<string>('Chargement...');
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    const testConnection = async (): Promise<void> => {
      try {
        // The API_URL for display remains the same as it's informational
        const displayApiUrl = "https://task-manager-api-yx13.onrender.com/api";
        console.log("Tentative de connexion à (via api instance, target est effectively /api) :", displayApiUrl) ;
        
        // Use the imported 'api' instance.
        // If api.defaults.baseURL is "https://task-manager-api-yx13.onrender.com",
        // then api.get('/api') will hit "https://task-manager-api-yx13.onrender.com/api".
        // If api.defaults.baseURL already includes "/api", then api.get('/') should be used.
        // Based on how other services in api.ts construct paths (e.g. /api/users/login),
        // it's assumed baseURL does NOT include /api.
        const response = await api.get<any>('/api'); // Using <any> for a generic test endpoint
        
        console.log("Réponse reçue :", response.data);
        setMessage(`Connexion réussie ! Réponse : ${JSON.stringify(response.data)}`);
      } catch (err: any) { // Catching as 'any' to inspect error structure
        console.error("Erreur de connexion :", err);
        let errorMessage = 'Erreur inconnue est survenue.';
        if (err.response && err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(`Erreur : ${errorMessage}`);
      }
    };

    testConnection();
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test de connexion à l'API</h1>
      <div style={{ marginBottom: '20px' }}>
        <h3>URL de l'API (Base URL de l'instance + /api) :</h3>
        {/* Displaying the effective URL might be more complex if baseURL is dynamic */}
        {/* For now, keeping the original informational display */}
        <code>https://task-manager-api-yx13.onrender.com/api</code>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Résultat :</h3>
        <p>{message}</p>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  ) ;
};

export default TestApi;
