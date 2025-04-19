import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TestApi = () => {
  const [message, setMessage] = useState('Chargement...');
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Cette fonction s'exécute quand la page se charge
    const testConnection = async () => {
      try {
        // Utilisez l'URL exacte de votre API telle qu'elle est dans api.js
        const apiUrl = "https://task-manager-api-yx13.onrender.com/api";
        
        // Affiche l'URL dans la console pour vérification
        console.log("Tentative de connexion à :", apiUrl) ;
        
        // Fait une requête simple à votre API
        const response = await axios.get(apiUrl);
        
        // Affiche la réponse dans la console
        console.log("Réponse reçue :", response.data);
        
        // Met à jour l'état avec le message de succès
        setMessage(`Connexion réussie ! Réponse : ${JSON.stringify(response.data)}`);
      } catch (err) {
        // En cas d'erreur, l'affiche dans la console
        console.error("Erreur de connexion :", err);
        
        // Met à jour l'état avec le message d'erreur
        setError(`Erreur : ${err.message}`);
      }
    };

    // Appelle la fonction de test
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
      
      <div>
        <h3>Instructions :</h3>
        <p>1. Si vous voyez "Connexion réussie", votre frontend est bien connecté à votre backend.</p>
        <p>2. Si vous voyez une erreur, vérifiez la console (F12)  pour plus de détails.</p>
      </div>
    </div>
  );
};

export default TestApi;
