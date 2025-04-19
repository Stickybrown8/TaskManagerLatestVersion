import React, { useState } from 'react';
import axios from 'axios';

const TestLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'https://task-manager-api-yx13.onrender.com';

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
};

export default TestLogin;
