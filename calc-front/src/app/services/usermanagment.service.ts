import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://localhost:7191/api/Auth';
  private cachedUsers: User[] = [];

  constructor(private http: HttpClient) {}

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
    return this.cachedUsers.filter(u => u.role === 'Admin').length;
  }

  getTotalUsersCount(): number {
    return this.cachedUsers.length;
  }
}