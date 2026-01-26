import { Injectable, PLATFORM_ID, Inject, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { LoginRequest } from '../interfaces/loginRequest';
import { LoginResponse } from '../interfaces/loginResponse';
import { RegisterRequest } from '../interfaces/registerRequest';




@Injectable({
  providedIn: 'root'
})
export class Auth {
  [x: string]: any;
  private apiUrl = 'https://localhost:7191/api'; // Update with your API URL
  private tokenKey = 'auth_token';
  private usernameKey = 'username';
  private isBrowser: boolean;
  private isSessionAlertOpen = false;
  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated$: Observable<boolean>;
  private router: Router;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
    this.router = inject(Router);

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

    return decoded&& decoded.role && decoded.role === 'Admin';
  }
  handleSessionExpired(): void {
    if (this.isSessionAlertOpen) return;
    this.isSessionAlertOpen = true;

    Swal.fire({
      title: 'Session Expired',
      text: 'Your security token is no longer valid.',
      icon: 'warning',
      showCancelButton: false,
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Accept & Login', // This is your button
      allowOutsideClick: false, // Force them to click the button
      allowEscapeKey: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeLogoutRoutine();
      }
    });
  }
  private executeLogoutRoutine(): void {
    this.logout(); // Clears tokens and updates BehaviorSubject
    this.isSessionAlertOpen = false;
    this.router.navigate(['/login']);
  }
  // Get user role
  getUserRole(key: string): string | null {
    const decoded = this.decodeToken(key);
    return decoded ? decoded.role : null;
  }
}