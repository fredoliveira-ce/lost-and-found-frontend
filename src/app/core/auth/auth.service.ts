import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../../shared/models/auth.model';
import { JwtPayload, decodeJwtPayload, isTokenExpired } from './jwt.util';

const TOKEN_STORAGE_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly tokenSignal = signal<string | null>(this.readStoredToken());
  readonly token = this.tokenSignal.asReadonly();

  readonly payload = computed<JwtPayload | null>(() => {
    const token = this.tokenSignal();
    return token ? decodeJwtPayload(token) : null;
  });

  readonly isAuthenticated = computed(() => !isTokenExpired(this.payload()));
  readonly isAdmin = computed(() => this.payload()?.role === 'ADMIN');
  readonly username = computed(() => this.payload()?.sub ?? null);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', credentials).pipe(
      tap((response) => {
        this.tokenSignal.set(response.token);
        localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      }),
    );
  }

  logout(): void {
    this.tokenSignal.set(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  private readStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }
}
