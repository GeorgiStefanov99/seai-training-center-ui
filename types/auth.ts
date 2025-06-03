export interface AuthState {
  userId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (token: string, userId: string) => void;
  logout: () => void;
}
