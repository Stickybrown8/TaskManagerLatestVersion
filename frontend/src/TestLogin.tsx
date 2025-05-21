import React, { useState, FormEvent, ChangeEvent } from 'react';
import { authService } from './services/api'; // Corrected import path

const TestLogin: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // API_URL is not needed if using authService which uses the configured api instance

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');
    
    try {
      console.log('Tentative de connexion...');
      
      // Use authService for the login request
      const responseData = await authService.login(email, password);
      
      console.log('Réponse reçue:', responseData);
      setResult(JSON.stringify(responseData, null, 2));
    } catch (err: any) { // Catching as 'any' to inspect error structure
      console.error('Erreur complète:', err);
      // Attempt to get a meaningful error message
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Une erreur inconnue est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test de Connexion</h1>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="test-login-email">Email:</label>
          <input 
            type="email"
            id="test-login-email" 
            value={email} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="test-login-password">Mot de passe:</label>
          <input 
            type="password"
            id="test-login-password" 
            value={password} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
