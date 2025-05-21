// === Ce fichier crée une page de test pour essayer de se connecter directement à l'API === /workspaces/TaskManagerLatestVersion/frontend/src/TestLogin.jsx
// Explication simple : Ce fichier est comme un petit outil indépendant qui permet aux développeurs de tester si la connexion à l'application fonctionne correctement - c'est comme un mini formulaire de connexion qui montre exactement ce qui se passe quand on essaie de se connecter.
// Explication technique : Composant React fonctionnel autonome qui fournit une interface utilisateur de test pour l'authentification, effectuant des requêtes directes à l'API backend sans passer par Redux ou d'autres couches.
// Utilisé dans : Disponible via une route spéciale (/test-login) dans App.tsx, principalement destiné aux tests et au débogage pendant le développement.
// Connecté à : API d'authentification backend via Axios (/api/users/login), importé dans App.tsx pour être inclus dans les routes.

import React, { useState } from 'react';
import axios from 'axios';

// === Début : Définition du composant TestLogin ===
// Explication simple : Cette partie crée une petite application autonome de connexion - c'est comme une cabine d'essayage pour vérifier si ton identifiant et mot de passe fonctionnent avec le serveur.
// Explication technique : Composant React fonctionnel qui encapsule un formulaire d'authentification de test, gérant son propre état et ses interactions avec l'API sans dépendre d'autres composants ou du store.
const TestLogin = () => {
  // === Début : Définition des états du composant ===
  // Explication simple : Ces lignes créent des petites boîtes de stockage pour garder les informations importantes comme ce que tu as tapé dans les champs et ce que le serveur te répond.
  // Explication technique : Déclarations de hooks useState multiples pour gérer l'état local du composant, incluant les valeurs du formulaire, les états de chargement et les réponses de l'API.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // === Fin : Définition des états du composant ===

  // === Début : Configuration de l'URL de l'API ===
  // Explication simple : Cette ligne dit à l'application où se trouve le serveur, comme quand tu écris l'adresse sur une enveloppe avant de l'envoyer.
  // Explication technique : Déclaration d'une constante qui définit l'URL de base de l'API backend pour les requêtes HTTP, hardcodée dans ce composant de test.
  const API_URL = 'https://task-manager-api-yx13.onrender.com';
  // === Fin : Configuration de l'URL de l'API ===

  // === Début : Fonction de gestion de la connexion ===
  // Explication simple : Cette fonction s'occupe d'envoyer ton email et ton mot de passe au serveur quand tu cliques sur le bouton, puis elle te montre si ça a marché ou s'il y a eu un problème.
  // Explication technique : Gestionnaire d'événement asynchrone qui traite la soumission du formulaire, envoyant les identifiants via Axios à l'API d'authentification et gérant les différents états (chargement, succès, erreur) avec mises à jour de l'UI.
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      console.log('Tentative de connexion...');
      
      const response = await axios.post(`${API_URL}/api/users/login`, {
        email,
        password
      });
      
      console.log('Réponse reçue:', response);
      setResult(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Erreur complète:', error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };
  // === Fin : Fonction de gestion de la connexion ===

  // === Début : Rendu de l'interface utilisateur ===
  // Explication simple : Cette partie dessine le formulaire que tu vois à l'écran, avec les champs pour ton email et ton mot de passe, le bouton pour te connecter, et les endroits où s'affichent les messages d'erreur ou de réussite.
  // Explication technique : Fonction de rendu JSX qui structure l'interface utilisateur du composant, incluant un formulaire avec validation, des styles en ligne, et des sections conditionnelles pour l'affichage des résultats ou erreurs.
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test de Connexion</h1>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>Mot de passe:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>
        <button 
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4a6da7',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red', marginTop: '20px', padding: '10px', backgroundColor: '#ffeeee', borderRadius: '4px' }}>
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Résultat:</h3>
          <pre style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
  // === Fin : Rendu de l'interface utilisateur ===
};
// === Fin : Définition du composant TestLogin ===

export default TestLogin;
