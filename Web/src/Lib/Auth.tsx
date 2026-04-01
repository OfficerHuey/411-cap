import { isAuthenticated, getUsername, getUserRole, logout as apiLogout } from "./api";

class AuthService {
  isAuthenticated(): boolean {
    return isAuthenticated();
  }

  getCurrentUser() {
    if (!this.isAuthenticated()) return null;
    return { name: getUsername(), role: getUserRole() };
  }

  logout() {
    apiLogout();
  }

  canEdit(): boolean {
    return this.isAuthenticated();
  }

  canOverride(): boolean {
    return this.isAuthenticated();
  }

  isStudent(): boolean {
    return getUserRole() === "Student";
  }
}

export const authService = new AuthService();
