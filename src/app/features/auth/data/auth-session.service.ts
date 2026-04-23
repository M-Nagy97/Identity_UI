import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AuthService } from '../../../core/api/generated';

const SESSION_KEY = 'reusable-identity-authenticated';
const ACCESS_TOKEN_KEY = 'reusable-identity-access-token';
const REFRESH_TOKEN_KEY = 'reusable-identity-refresh-token';
const USER_ID_KEY = 'reusable-identity-user-id';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isAuthenticated = signal<boolean>(this.readSessionState());
  readonly currentUserId = signal<string | null>(this.resolveUserId());

  login(credentials: { username: string; password: string }): Observable<void> {
    return this.authService.apiAuthLoginPost({
      userNameOrEmail: credentials.username,
      password: credentials.password,
    } as never).pipe(
      tap((response) => this.setSession(response)),
      map(() => void 0),
    );
  }

  register(payload: {
    username: string;
    email: string;
    password: string;
    name: string;
    family: string;
  }): Observable<void> {
    const displayName = [payload.name, payload.family].filter(Boolean).join(' ').trim();

    return this.authService.apiAuthRegisterPost({
      userName: payload.username,
      email: payload.email,
      password: payload.password,
      firstName: payload.name,
      lastName: payload.family,
      displayName: displayName || payload.username,
    } as never).pipe(map(() => void 0));
  }

  logout(): Observable<void> {
    const refreshToken = this.readStorage(REFRESH_TOKEN_KEY);

    return (refreshToken
      ? this.authService.apiAuthRevokeRefreshTokenPost({ refreshToken })
      : of(null)
    ).pipe(
      catchError(() => of(null)),
      tap(() => {
        this.clearSession();
        void this.router.navigateByUrl('/login');
      }),
      map(() => void 0),
    );
  }

  private setSession(response: any): void {
    this.isAuthenticated.set(true);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SESSION_KEY, 'true');

      if (response?.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
      }

      if (response?.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      }

      if (response?.userId) {
        localStorage.setItem(USER_ID_KEY, response.userId);
        this.currentUserId.set(response.userId);
      }
    }
  }

  private readSessionState(): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    return localStorage.getItem(SESSION_KEY) === 'true';
  }

  private clearSession(): void {
    this.isAuthenticated.set(false);

    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    this.currentUserId.set(null);
  }

  private readStorage(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(key);
  }

  /**
   * Resolves the current user ID from localStorage first,
   * falling back to parsing the JWT access token's 'sub' claim.
   */
  private resolveUserId(): string | null {
    const stored = this.readStorage(USER_ID_KEY);
    if (stored) {
      return stored;
    }

    // Fallback: parse userId from the JWT access token
    const token = this.readStorage(ACCESS_TOKEN_KEY);
    if (token) {
      const userId = this.parseUserIdFromToken(token);
      if (userId && typeof localStorage !== 'undefined') {
        // Persist so future reads don't need to parse again
        localStorage.setItem(USER_ID_KEY, userId);
      }
      return userId;
    }

    return null;
  }

  /**
   * Decodes the JWT payload and extracts the 'sub' claim (userId).
   */
  private parseUserIdFromToken(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(atob(parts[1]));
      return payload?.sub ?? null;
    } catch {
      return null;
    }
  }
}
