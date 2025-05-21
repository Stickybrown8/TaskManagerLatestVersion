// === Ce fichier permet de créer rapidement un compte administrateur dans l'application === /workspaces/TaskManagerLatestVersion/frontend/src/AdminSetup.js
// Explication simple : Ce fichier crée une page spéciale avec un gros bouton qui, quand tu cliques dessus, fabrique automatiquement un compte "super utilisateur" pour contrôler toute l'application.
// Explication technique : Composant React fonctionnel qui offre une interface d'administration pour créer un compte utilisateur avec des privilèges d'administrateur via l'API d'authentification.
// Utilisé dans : Route spéciale d'administration, généralement protégée ou accessible uniquement pendant le développement ou l'installation initiale de l'application.
// Connecté à : API d'authentification (/auth/register) via Axios, potentiellement importé dans App.js ou dans le routeur principal pour être accessible via une route spécifique.

import React, { useState } from 'react';
import axios from 'axios';

// === Début : Définition du composant AdminSetup ===
// Explication simple : Cette partie crée une page spéciale avec un bouton pour ajouter un chef à l'application, comme quand tu nommes un capitaine pour ton équipe de jeu.
// Explication technique : Composant React fonctionnel qui encapsule la logique et l'interface utilisateur pour la création d'un compte administrateur, utilisant les hooks d'état pour gérer le chargement, les résultats et les erreurs.
const AdminSetup = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'https://task-manager-api-yx13.onrender.com';

  // === Début : Fonction de création d'utilisateur admin ===
  // Explication simple : Cette fonction est comme une machine automatique qui fabrique un compte spécial quand tu appuies sur le bouton, puis te dit si ça a marché ou s'il y a eu un problème.
  // Explication technique : Fonction asynchrone qui effectue une requête POST vers l'API d'authentification pour créer un utilisateur avec le rôle 'admin', gérant les états de chargement, de succès et d'erreur via les setters du useState.
  const createUser = async ()  => {
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      console.log('Tentative de création d\'utilisateur...');
      
      // Données de l'utilisateur à créer
      const userData = {
        name: 'Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      };
      
      console.log('Données utilisateur:', userData);

      // Essayons une route différente
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      console.log('Réponse reçue:', response);
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Erreur complète:', error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };
  // === Fin : Fonction de création d'utilisateur admin ===

  // === Début : Rendu de l'interface utilisateur ===
  // Explication simple : Cette partie dessine la page que tu vois à l'écran, avec le titre, le bouton pour créer un utilisateur, et les endroits où s'affichent les messages d'erreur ou de succès.
  // Explication technique : Fonction de rendu JSX qui structure l'interface utilisateur avec un conteneur stylisé, un bouton d'action principal, des zones conditionnelles pour l'affichage des erreurs et des résultats, et un bloc d'informations sur les identifiants créés.
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Configuration Admin</h1>
      <button 
        onClick={createUser}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4a6da7',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Création en cours...' : 'Créer utilisateur admin'}
      </button>

      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffeeee', borderRadius: '4px' }}>
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Résultat:</h3>
          <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
            {result}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Informations de connexion:</h3>
        <p><strong>Email:</strong> admin@example.com</p>
        <p><strong>Mot de passe:</strong> password123</p>
      </div>
    </div>
  );
  // === Fin : Rendu de l'interface utilisateur ===
};
// === Fin : Définition du composant AdminSetup ===

export default AdminSetup;
