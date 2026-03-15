// User from Supabase Auth
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

// Auth State
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
