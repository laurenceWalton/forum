import React, { useState } from 'react';
import api from './api';
import type { Post } from './types';

interface CreatePostProps {
  onPostCreated: (newPost: Post) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/posts/', { content });
      onPostCreated(response.data);
      setContent('');
    } catch (err) {
      alert('Failed to publish post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'var(--bg-secondary)', 
      padding: '1.5rem', 
      borderRadius: 'var(--card-radius)', 
      border: 'var(--card-border)',
      marginBottom: '2rem'
    }}>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Share something with the Barrows community..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          style={{
            width: '100%',
            minHeight: '100px',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '1rem',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: '1.6'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #2A2B2E', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <button 
            type="submit" 
            disabled={isSubmitting || !content.trim()}
            style={{ 
              opacity: isSubmitting || !content.trim() ? 0.5 : 1,
              padding: '0.5rem 1.5rem',
              fontSize: '0.9rem'
            }}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
