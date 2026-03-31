export interface User {
  id: string;
  name: string;
  email: string;
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

  private users = [
    {
      id: "1",
      email: "12345@selu.edu",
      password: "12345",
      name: "Dr. Sarah Johnson",
    },
    {
      id: "2",
      email: "prof1@nursing.edu",
      password: "prof123",
      name: "Dr. Michael Chen",
    },
    {
      id: "3",
      email: "prof2@nursing.edu",
      password: "prof123",
      name: "Dr. Emily Rodriguez",
    },
  ];

  login(email: string, password: string): User | null {
    const user = this.users.find(
      (u) => u.email === email && u.password === password,
    );
    if (user) {
      this.currentUser = { id: user.id, name: user.name, email: user.email };
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
    return true;
  }

  canEdit(): boolean {
    return true;
  }

  isStudent(): boolean {
    return false;
  }

  getMockCredentials() {
    return this.users.map((p) => ({
      email: p.email,
      password: p.password,
      name: p.name,
    }));
  }
}

export const authService = new AuthService();
