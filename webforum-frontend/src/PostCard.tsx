import React, { useState } from 'react';
import type { Post, Comment, User } from './types';
import api from './api';
import { MessageSquare, ThumbsUp, AlertTriangle } from 'lucide-react';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [localPost, setLocalPost] = useState<Post>(post);

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      try {
        const response = await api.get(`/comments/?post=${post.id}`);
        setComments(response.data);
      } catch (err) {
        console.error('Failed to load comments');
      }
    }
    setShowComments(!showComments);
  };

  const handleLike = async () => {
    try {
      await api.post(`/posts/${post.id}/like/`);
      const response = await api.get(`/posts/${post.id}/`);
      setLocalPost(response.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to like post');
    }
  };

  const handleFlag = async () => {
    try {
      const response = await api.patch(`/posts/${post.id}/flag/`, { is_misleading: true });
      setLocalPost(response.data);
    } catch (err) {
      alert('Failed to flag post');
    }
  };

  // Permission Checks
  const isModerator = currentUser?.is_moderator || false;
  const isOwnPost = currentUser?.user_id === localPost.author;

  return (
    <div style={{ 
      backgroundColor: 'var(--bg-secondary)', 
      padding: '1.5rem', 
      borderRadius: 'var(--card-radius)', 
      border: localPost.is_misleading ? '2px solid var(--accent-red)' : 'var(--card-border)',
      marginBottom: '1.5rem',
      transition: 'all 0.3s ease'
    }}>
      {localPost.is_misleading && (
        <div style={{ color: 'var(--accent-red)', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertTriangle size={14} /> MISLEADING OR FALSE INFORMATION
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>@{localPost.author_username}</span>
          {localPost.category && (
            <span style={{ 
              fontSize: '0.65rem', 
              backgroundColor: 'rgba(0, 85, 255, 0.1)', 
              color: 'var(--accent-blue)', 
              padding: '2px 8px', 
              borderRadius: '10px',
              border: '1px solid rgba(0, 85, 255, 0.2)',
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {localPost.category}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {new Date(localPost.created_at).toLocaleDateString()}
        </span>
      </div>

      <p style={{ lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>{localPost.content}</p>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', borderTop: '1px solid #2A2B2E', paddingTop: '1rem' }}>
        
        {/* Only show Like button if it's NOT the user's own post */}
        {!isOwnPost && (
          <button onClick={handleLike} style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px', padding: '0', color: 'var(--text-primary)' }}>
            <ThumbsUp size={18} color={localPost.like_count > 0 ? 'var(--accent-blue)' : 'white'} />
            <span style={{ fontSize: '0.9rem' }}>{localPost.like_count}</span>
          </button>
        )}

        {/* If it IS their own post, show a static indicator instead */}
        {isOwnPost && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <ThumbsUp size={18} />
            <span style={{ fontSize: '0.9rem' }}>{localPost.like_count}</span>
          </div>
        )}

        <button onClick={toggleComments} style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px', padding: '0', color: 'var(--text-primary)' }}>
          <MessageSquare size={18} />
          <span style={{ fontSize: '0.9rem' }}>{localPost.comment_count}</span>
        </button>

        {/* Only show Flag button if user is a Moderator AND post isn't already flagged */}
        {isModerator && !localPost.is_misleading && (
          <button onClick={handleFlag} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', fontSize: '0.7rem', padding: '4px 8px' }}>
            Flag Misleading
          </button>
        )}
      </div>

      {showComments && (
        <div style={{ marginTop: '1.5rem', paddingLeft: '1rem', borderLeft: '2px solid #2A2B2E' }}>
          {comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>@{comment.author_username}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{comment.content}</div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#555' }}>No comments yet.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
