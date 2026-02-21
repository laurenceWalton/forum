import { useState, useEffect, useRef } from 'react';
import './App.css';
import Login from './Login';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import api from './api';
import type { Post, User } from './types';
import { Search, X } from 'lucide-react';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;
    try { return JSON.parse(savedUser); } catch { return null; }
  });
  
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (token) {
      if (searchQuery.trim().length > 2) {
        handleDebouncedSearch();
      } else if (searchQuery.trim().length === 0) {
        // Cancel any pending search to prevent it from overwriting the feed
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        fetchInitialData();
      }
    }
  }, [token, searchQuery]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const postsRes = await api.get('/posts/');
      setPosts(postsRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleDebouncedSearch = () => {
    // 1. Clear existing timer
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    // 2. Immediate UI feedback
    setIsSearching(true);
    setLoading(true);
    setPosts([]); // Clear posts immediately as requested

    // 3. Set new timer for 600ms
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await api.get(`/posts/search/?q=${encodeURIComponent(searchQuery)}`);
        setPosts(response.data);
      } catch (err) {
        console.error('Search failed');
      } finally {
        setLoading(false);
      }
    }, 600);
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
        padding: '1.5rem 0',
        borderBottom: 'var(--card-border)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 'bold', color: '#FFFFFF', letterSpacing: '2px' }}>BARROWS</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', fontWeight: 'bold', letterSpacing: '1px' }}>CONNECTED STORE.</span>
        </div>
        
        <div style={{ flex: 1, margin: '0 3rem', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
          <input 
            type="text" 
            placeholder="Search community by meaning..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              marginBottom: 0, 
              paddingLeft: '2.5rem', 
              fontSize: '0.9rem',
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: '20px'
            }}
          />
          {searchQuery && (
            <X 
              size={16} 
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555', cursor: 'pointer' }} 
            />
          )}
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
          <h2 style={{ margin: 0 }}>
            {searchQuery ? `Search results for "${searchQuery}"` : 'Community Forum'}
          </h2>
          <button 
            onClick={() => setShowCreate(!showCreate)}
            style={{ fontSize: '0.9rem', backgroundColor: showCreate ? 'transparent' : 'var(--accent-blue)', border: showCreate ? '1px solid #333' : 'none' }}
          >
            {showCreate ? 'Cancel' : 'Create Post'}
          </button>
        </div>

        {showCreate && <CreatePost onPostCreated={handlePostCreated} />}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            {isSearching ? 'Analyzing Barrows semantic network...' : 'Initialising Network...'}
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
                {searchQuery ? 'No semantically related posts found.' : 'No active discussions found.'}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
