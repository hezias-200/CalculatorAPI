import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'https://localhost:7191/api'; // Update with your API URL
  private tokenKey = 'auth_token';
  private usernameKey = 'username';
  private isBrowser: boolean;

  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated$: Observable<boolean>;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.setToken(response.token);
          this.setUsername(response.username);
          this.isAuthenticatedSubject.next(true);
        })
      );
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    this.removeItem(this.tokenKey);
    this.removeItem(this.usernameKey);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return this.getItem(this.tokenKey);
  }

  getUsername(): string | null {
    return this.getItem(this.usernameKey);
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  private setToken(token: string): void {
    this.setItem(this.tokenKey, token);
  }

  private setUsername(username: string): void {
    this.setItem(this.usernameKey, username);
  }

  private hasToken(): boolean {
    return !!this.getItem(this.tokenKey);
  }

  // Safe localStorage access methods
  private getItem(key: string): string | null {
    if (this.isBrowser) {      
      return localStorage.getItem(key);
    }
    return null;
  }

  private setItem(key: string, value: string): void {
    if (this.isBrowser) {
      localStorage.setItem(key, value);
    }
  }

  private removeItem(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
    }
  }
  decodeToken(token: string): any {
    if (!token) return null;

    try {
      // JWT structure: header.payload.signature
      const payload = token.split('.')[1];
      // Decode base64
      const decodedPayload = JSON.parse(atob(payload));
      
      return decodedPayload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
  // Check if user is Admin
  isAdmin(key: string): boolean {
    const decoded = this.decodeToken(key);

    return decoded && decoded.role === 'Admin';
  }
  // Get user role
  getUserRole(key: string): string | null {
    const decoded = this.decodeToken(key);
    return decoded ? decoded.role : null;
  }
}