import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  map,
  tap,
  throwError,
} from 'rxjs';

interface SignupPayload {
  username: string;
  email: string;
  password: string;
}

interface LoginPayload {
  username: string;
  password: string;
}

interface UserProfile {
  username: string;
  email: string;
  is_admin?: boolean;
}

interface LoginResponse {
  token: string;
  username: string;
  email: string;
  is_admin: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = 'http://127.0.0.1:8000/userAuth';
  private readonly tokenStorageKey = 'moviesDbAuthToken';
  private readonly userStorageKey = 'moviesDbAuthUser';
  private readonly browser: boolean;
  private isLoggingOut = false;

  private readonly loggedInSubject = new BehaviorSubject<boolean>(false);
  readonly isLoggedIn$ = this.loggedInSubject.asObservable();

  private readonly userSubject = new BehaviorSubject<UserProfile | null>(null);
  readonly currentUser$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.browser = isPlatformBrowser(platformId);
    this.restoreSession();
  }

  signup(payload: SignupPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/signup/`, payload);
  }

  checkUsernameExists(username: string): Observable<boolean> {
    return this.http
      .get<{ exists: boolean }>(`${this.baseUrl}/check-username/`, {
        params: { username },
      })
      .pipe(map((response) => response.exists));
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.http
      .get<{ exists: boolean }>(`${this.baseUrl}/check-email/`, {
        params: { email },
      })
      .pipe(map((response) => response.exists));
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login/`, payload)
      .pipe(
        tap((response) => {
          this.persistSession(response.token, {
            username: response.username,
            email: response.email,
            is_admin: response.is_admin,
          });
        }),
      );
  }

  logout(): Observable<unknown> {
    this.isLoggingOut = true;
    return this.http.post(`${this.baseUrl}/logout/`, {}).pipe(
      catchError((error) => {
        return throwError(() => error);
      }),
      finalize(() => {
        this.clearSession();
        this.isLoggingOut = false;
      }),
    );
  }

  getToken(): string | null {
    if (!this.browser) {
      return null;
    }
    const token = localStorage.getItem(this.tokenStorageKey);
    if (!token || this.isTokenExpired(token)) {
      this.clearSession();
      return null;
    }
    return token;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return Boolean(token) && this.loggedInSubject.value;
  }

  handleUnauthorized(): void {
    if (this.isLoggingOut || !this.isLoggedIn()) {
      return;
    }
    this.clearSession();
    this.router.navigate(['/login'], {
      queryParams: { session: 'expired' },
    });
  }

  private persistSession(token: string, user: UserProfile): void {
    if (this.browser) {
      localStorage.setItem(this.tokenStorageKey, token);
      localStorage.setItem(this.userStorageKey, JSON.stringify(user));
    }
    this.userSubject.next(user);
    this.loggedInSubject.next(true);
  }

  private clearSession(): void {
    if (this.browser) {
      localStorage.removeItem(this.tokenStorageKey);
      localStorage.removeItem(this.userStorageKey);
    }
    this.userSubject.next(null);
    this.loggedInSubject.next(false);
  }

  private restoreSession(): void {
    if (!this.browser) {
      return;
    }

    const token = localStorage.getItem(this.tokenStorageKey);
    const userJson = localStorage.getItem(this.userStorageKey);

    if (!token || this.isTokenExpired(token)) {
      this.clearSession();
      return;
    }

    this.loggedInSubject.next(true);

    if (userJson) {
      try {
        this.userSubject.next(JSON.parse(userJson) as UserProfile);
      } catch {
        this.userSubject.next(null);
      }
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) {
        return true;
      }

      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(normalized)) as { exp?: number };

      if (!payload.exp) {
        return false;
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      return payload.exp <= nowInSeconds;
    } catch {
      return true;
    }
  }
}
