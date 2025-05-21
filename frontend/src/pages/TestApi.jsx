// === Ce fichier crée une page de test qui vérifie si l'API du backend fonctionne correctement === /workspaces/TaskManagerLatestVersion/frontend/src/pages/TestApi.jsx
// Explication simple : C'est comme un testeur qui vérifie si le serveur est en ligne et répond correctement quand on lui parle.
// Explication technique : Composant React fonctionnel qui effectue une requête HTTP GET vers l'API backend pour vérifier sa disponibilité et affiche le résultat.
// Utilisé dans : Le routeur de l'application, probablement accessible via une route /test-api, utilisé principalement pour le débogage et les tests.
// Connecté à : API backend via axios, aucune connexion à d'autres composants React ou au store Redux.

import React, { useEffect, useState } from 'react';
import axios from 'axios';

// === Début : Composant principal TestApi ===
// Explication simple : C'est la page entière qui teste si l'application peut parler avec le serveur et nous montre le résultat.
// Explication technique : Composant fonctionnel React qui encapsule la logique de test d'API et le rendu des résultats, avec gestion d'état local via useState.
const TestApi = () => {
  // === Début : Déclaration des états du composant ===
  // Explication simple : On crée deux boîtes pour stocker les informations : une pour le message normal et une pour les erreurs.
  // Explication technique : Initialisation de deux états React locaux avec useState pour gérer le message de statut et l'erreur potentielle.
  const [message, setMessage] = useState('Chargement...');
  const [error, setError] = useState('');
  // === Fin : Déclaration des états du composant ===
  
  // === Début : Test de connexion à l'API au chargement ===
  // Explication simple : Dès que la page s'ouvre, on essaie de se connecter au serveur pour voir s'il répond.
  // Explication technique : Hook useEffect qui s'exécute une seule fois au montage du composant et déclenche une requête API asynchrone avec gestion des réponses et erreurs.
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
  // === Fin : Test de connexion à l'API au chargement ===

  // === Début : Affichage du résultat du test ===
  // Explication simple : Cette partie dessine la page avec le titre et les résultats du test.
  // Explication technique : Rendu JSX du composant qui affiche le titre, l'URL testée, et les résultats du test avec gestion conditionnelle des erreurs.
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
  // === Fin : Affichage du résultat du test ===
};
// === Fin : Composant principal TestApi ===

export default TestApi;
