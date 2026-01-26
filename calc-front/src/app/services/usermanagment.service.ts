import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../interfaces/user';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://localhost:7191/api/Auth';
  private cachedUsers: User[] = [];

  constructor(private http: HttpClient, private router: Router) { }

  // Get all users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`).pipe(
      tap(users => this.cachedUsers = users)
    );
  }

  // Delete user
  deleteUser(username: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${username}`);
  }

  // Get counts (use cached data to avoid extra API calls)
  getActiveUsersCount(): number {
    return this.cachedUsers.filter(u => u.isActive).length;
  }

  getAdminUsersCount(): number {
    return this.cachedUsers.filter(u => u.role === 'admin').length;
  }

  getTotalUsersCount(): number {
    return this.cachedUsers.length;
  }
  goToUserManagement(): void {
    this.router.navigate(['/user-management']);
  }
}