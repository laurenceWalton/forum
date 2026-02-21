export interface User {
  user_id: number;
  username: string;
  is_moderator: boolean;
}

export interface Comment {
  id: number;
  author: number;
  author_username: string;
  content: string;
  created_at: string;
}

export interface Post {
  id: number;
  author: number;
  author_username: string;
  content: string;
  created_at: string;
  is_misleading: boolean;
  like_count: number;
  comment_count: number;
}
