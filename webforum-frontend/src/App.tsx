import { useState, useEffect, useRef } from 'react';
import './App.css';
import Login from './Login';
import PostCard from './PostCard';
import CreatePost from './CreatePost';
import api from './api';
import type { Post, User } from './types';
import { Search, X } from 'lucide-react';

const CATEGORIES = ["All", "ConnectOS", "Hardware", "News", "Q&A"];

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
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (token) {
      if (searchQuery.trim().length > 2) {
        handleDebouncedSearch();
      } else if (searchQuery.trim().length === 0) {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        fetchInitialData();
      }
    }
  }, [token, searchQuery, selectedCategory]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === "All" ? '/posts/' : `/posts/?category=${encodeURIComponent(selectedCategory)}`;
      const postsRes = await api.get(url);
      setPosts(postsRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handleDebouncedSearch = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setIsSearching(true);
    setLoading(true);
    setPosts([]);

    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await api.get(`/posts/search/?q=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}`);
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
        padding: '1rem 0',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Community Forum</h2>
          <button 
            onClick={() => setShowCreate(!showCreate)}
            style={{ fontSize: '0.9rem', backgroundColor: showCreate ? 'transparent' : 'var(--accent-blue)', border: showCreate ? '1px solid #333' : 'none' }}
          >
            {showCreate ? 'Cancel' : 'Create Post'}
          </button>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                fontSize: '0.75rem',
                padding: '4px 12px',
                backgroundColor: selectedCategory === cat ? 'var(--accent-blue)' : 'transparent',
                border: `1px solid ${selectedCategory === cat ? 'var(--accent-blue)' : '#333'}`,
                color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {showCreate && <CreatePost onPostCreated={handlePostCreated} />}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            {isSearching ? 'Analyzing Barrows semantic network...' : 'Updating feed...'}
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
                {searchQuery ? 'No semantically related posts found.' : 'No active discussions found in this category.'}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
