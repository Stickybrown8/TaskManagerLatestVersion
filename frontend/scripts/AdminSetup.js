import React, { useState } from 'react';
import axios from 'axios';

const AdminSetup = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'https://task-manager-api-yx13.onrender.com';

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
};

export default AdminSetup;
