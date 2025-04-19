import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TestApi = () => {
  const [message, setMessage] = useState('Chargement...');
  const [error, setError] = useState('');
  
  useEffect(() => {
    const testConnection = async () => {
      try {
        const apiUrl = "https://task-manager-api-yx13.onrender.com/api";
        console.log("Tentative de connexion à :", apiUrl) ;
        const response = await axios.get(apiUrl);
        console.log("Réponse reçue :", response.data);
        setMessage(`Connexion réussie ! Réponse : ${JSON.stringify(response.data)}`);
      } catch (err) {
        console.error("Erreur de connexion :", err);
        setError(`Erreur : ${err.message}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test de connexion à l'API</h1>
      <div style={{ marginBottom: '20px' }}>
        <h3>URL de l'API testée :</h3>
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
