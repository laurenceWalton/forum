import { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import api from './api';
import type { Post, User } from './types';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (token) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Error re-syncing user:", e);
        }
      }
      fetchInitialData();
    }
  }, [token]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const postsRes = await api.get('/posts/');
      setPosts(postsRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts]);
    setShowCreate(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setPosts([]);
    setUser(null);
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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 'bold', color: '#FFFFFF', letterSpacing: '2px' }}>BARROWS</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px' }}>CONNECTED STORE.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{user.username}</span>}
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid #333', fontSize: '0.8rem' }}>
            Logout
          </button>
        </div>
      </header>

      <main>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>Community Forum</h2>
          <button 
            onClick={() => setShowCreate(!showCreate)}
            style={{ fontSize: '0.9rem', backgroundColor: showCreate ? 'transparent' : 'var(--accent-blue)', border: showCreate ? '1px solid #333' : 'none' }}
          >
            {showCreate ? 'Cancel' : 'Create Post'}
          </button>
        </div>

        {showCreate && <CreatePost onPostCreated={handlePostCreated} />}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Initialising Barrows Connected Network...
          </div>
        ) : (
          <div className="post-list">
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUser={user} 
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--card-radius)' }}>
                No active discussions found.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
