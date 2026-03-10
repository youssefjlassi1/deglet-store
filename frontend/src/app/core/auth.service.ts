import { Injectable, computed, signal } from '@angular/core';
import { AuthResponse, User } from './models';

const TOKEN_KEY = 'dhaoui-token';
const USER_KEY = 'dhaoui-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenState = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly userState = signal<User | null>(this.readUserFromStorage());

  readonly currentUser = computed(() => this.userState());
  readonly token = computed(() => this.tokenState());
  readonly isAuthenticated = computed(() => !!this.userState() && !!this.tokenState());
  readonly isAdmin = computed(() => this.userState()?.role === 'admin');

  setSession(authResponse: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, authResponse.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));
    this.tokenState.set(authResponse.accessToken);
    this.userState.set(authResponse.user);
  }

  updateUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userState.set(user);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenState.set(null);
    this.userState.set(null);
  }

  private readUserFromStorage(): User | null {
    const rawUser = localStorage.getItem(USER_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}