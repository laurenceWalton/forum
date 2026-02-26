import React, { useState, useEffect } from 'react';
import type { Post, Comment, User } from './types';
import api from './api';
import { MessageSquare, ThumbsUp, AlertTriangle, Send } from 'lucide-react';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUser }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [localPost, setLocalPost] = useState<Post>(post);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Watch for changes to the 'post' prop from the parent (App.tsx)
  // and update our local state to reflect the new category/author data.
  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/?post=${post.id}`);
      setComments(response.data);
    } catch (err) {
      console.error('Failed to load comments');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await api.post('/comments/', {
        post: localPost.id,
        content: newComment
      });
      
      // Update local comments list immediately
      setComments([...comments, response.data]);
      setNewComment('');
      
      // Increment comment count locally
      setLocalPost({
        ...localPost,
        comment_count: localPost.comment_count + 1
      });
    } catch (err) {
      alert('Failed to post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    try {
      await api.post(`/posts/${localPost.id}/like/`);
      const response = await api.get(`/posts/${localPost.id}/`);
      setLocalPost(response.data);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to like post');
    }
  };

  const handleFlag = async () => {
    try {
      const response = await api.patch(`/posts/${localPost.id}/flag/`, { is_misleading: true });
      setLocalPost(response.data);
    } catch (err) {
      alert('Failed to flag post');
    }
  };

  // Permission Checks
  const isModerator = currentUser?.is_moderator || false;
  
  // Force numeric comparison to avoid string/number mismatch bugs
  const isOwnPost = Number(currentUser?.user_id) === Number(localPost.author);

  // Debugging log to help us find the mismatch
  console.log(`Checking Post ${localPost.id}: CurrentUser ID: ${currentUser?.user_id} | Post Author ID: ${localPost.author} | Result: ${isOwnPost}`);

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
          {localPost.category ? (
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
          ) : (
            <span style={{ fontSize: '0.6rem', color: '#555', fontStyle: 'italic' }}>Processing AI tags...</span>
          )}
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {new Date(localPost.created_at).toLocaleDateString()}
        </span>
      </div>

      <p style={{ lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>{localPost.content}</p>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', borderTop: '1px solid #2A2B2E', paddingTop: '1rem' }}>
        
        {!isOwnPost ? (
          <button onClick={handleLike} style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px', padding: '0', color: 'var(--text-primary)' }}>
            <ThumbsUp size={18} color={localPost.like_count > 0 ? 'var(--accent-blue)' : 'white'} />
            <span style={{ fontSize: '0.9rem' }}>{localPost.like_count}</span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <ThumbsUp size={18} />
            <span style={{ fontSize: '0.9rem' }}>{localPost.like_count}</span>
          </div>
        )}

        <button onClick={toggleComments} style={{ background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px', padding: '0', color: 'var(--text-primary)' }}>
          <MessageSquare size={18} color={showComments ? 'var(--accent-blue)' : 'white'} />
          <span style={{ fontSize: '0.9rem' }}>{localPost.comment_count}</span>
        </button>

        {isModerator && !localPost.is_misleading && (
          <button onClick={handleFlag} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', fontSize: '0.7rem', padding: '4px 8px' }}>
            Flag Misleading
          </button>
        )}
      </div>

      {showComments && (
        <div style={{ marginTop: '1.5rem', paddingLeft: '1rem', borderLeft: '2px solid #2A2B2E' }}>
          {/* New Comment Input */}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              placeholder="Write a reply..." 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{ margin: 0, fontSize: '0.85rem', padding: '8px 12px' }}
            />
            <button type="submit" disabled={!newComment.trim()} style={{ padding: '8px' }}>
              <Send size={16} />
            </button>
          </form>

          {/* Comments List */}
          {comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.2rem', color: 'var(--accent-blue)' }}>@{comment.author_username}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{comment.content}</div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#555' }}>No replies yet.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
