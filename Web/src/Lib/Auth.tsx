export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'professor' | 'student';
}

export interface Override {
  id: string;
  sectionId: string;
  timestamp: Date;
  professorId: string;
  professorName: string;
  changes: string;
  reason?: string;
}

class AuthService {
  private currentUser: User | null = null;
  private overrides: Override[] = [];

  // Mock users database
  private users = [
    { id: '1', email: '12345@selu.edu', password: '12345', name: 'Dr. Sarah Johnson', role: 'admin' as const },
    { id: '2', email: 'prof1@nursing.edu', password: 'prof123', name: 'Dr. Michael Chen', role: 'professor' as const },
    { id: '3', email: 'prof2@nursing.edu', password: 'prof123', name: 'Dr. Emily Rodriguez', role: 'professor' as const },

  ];

  login(email: string, password: string): User | null {
    const user = this.users.find(
      u => u.email === email && u.password === password
    );

    if (user) {
      this.currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      return this.currentUser;
    }

    return null;
  }

  logout() {
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  canOverride(): boolean {
    return this.currentUser?.role === 'admin';
  }

  canEdit(): boolean {
    return this.currentUser?.role === 'admin' || this.currentUser?.role === 'professor';
  }

  isStudent(): boolean {
    return this.currentUser?.role === 'student';
  }

  logOverride(override: Omit<Override, 'id' | 'timestamp' | 'professorId' | 'professorName'>): void {
    if (!this.currentUser) return;

    this.overrides.push({
      ...override,
      id: `override-${Date.now()}`,
      timestamp: new Date(),
      professorId: this.currentUser.id,
      professorName: this.currentUser.name,
    });
  }

  getOverrides(): Override[] {
    return [...this.overrides];
  }

  getMockCredentials() {
    return this.users.map(p => ({
      email: p.email,
      password: p.password,
      name: p.name,
      role: p.role,
    }));
  }
}

export const authService = new AuthService();