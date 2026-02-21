import { useState } from 'react';
import './App.css';
import Login from './Login';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return <Login onLoginSuccess={(newToken) => setToken(newToken)} />;
  }

  return (
    <div className="app-container">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '1rem 0',
        borderBottom: 'var(--card-border)',
        marginBottom: '2rem'
      }}>
        <div>
          <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>BARROWS CONNECTED STORE.</span>
        </div>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid #333' }}>Logout</button>
      </header>
      <main>
        <h2>Forum Feed</h2>
        <div style={{ padding: '2rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--card-radius)', textAlign: 'center' }}>
          Posts Loading...
        </div>
      </main>
    </div>
  );
}

export default App;
