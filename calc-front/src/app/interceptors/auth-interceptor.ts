import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  const token = authService.getToken();

  // Clone the request and add the authorization header if token exists
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }


  // ✅ Add error handling and logging
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.handleSessionExpired();// This will alert and redirect
      }
      return throwError(() => error);
    })
  );
};