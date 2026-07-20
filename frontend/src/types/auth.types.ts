export type Role = "owner" | "admin";

export interface User {
  _id: string;
  name: string;
  role: Role;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  isAdmin: boolean;
}
