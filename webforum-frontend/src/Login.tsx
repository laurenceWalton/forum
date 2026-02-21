import React, { useState } from 'react';
import api from './api';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/login/', { username, password });
      const { token, ...userData } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      onLoginSuccess(token);
    } catch (err) {
      setError('Invalid credentials.');
    }
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '10vh' }}>
      <div style={{ marginBottom: '3rem', display: 'inline-block' }}>
        <div style={{ fontSize: '4.5rem', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '0.5rem' }}>B.</div>
        
        {/* Brand Block */}
        <div style={{ width: '260px' }}>
          <h1 style={{ 
            margin: 0, 
            color: 'var(--text-secondary)', 
            fontSize: '3rem', 
            lineHeight: '0.8',
            letterSpacing: '0.05em'
          }}>BARROWS</h1>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '0.5rem', 
            color: 'var(--text-secondary)', 
            fontSize: '1.6rem', 
            fontWeight: 'bold', 
            padding: '0 4px' // Tiny padding to align visually with the H1's optical weight
          }}>
            <span>CONNECTED STORE.</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '320px', margin: '0 auto' }}>
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem' }}>{error}</p>}
        <button type="submit" style={{ width: '100%', marginTop: '1rem' }}>Sign In</button>
      </form>
    </div>
  );
};

export default Login;
