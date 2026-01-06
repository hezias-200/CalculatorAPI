import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export interface User {
  id: number;
  username: string;
  role: string;
  isActive: boolean;
}

@Component({
  selector: 'app-user-management',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './usermanagement.html',
  styleUrl: './usermanagement.css',
})
export class UserManagement implements OnInit {
  users: User[] = [];
  error: string = '';
  
  private apiUrl = 'https://localhost:7191/api/Auth';

  constructor(
    private http: HttpClient,
    private authService: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const isAdmin = this.authService.isAdmin(this.authService.getToken() || '');
    
    if (!isAdmin) {
      this.error = 'Access denied';
      return;
    }

    this.loadUsers();
  }

  loadUsers(): void {
    this.http.get<User[]>(`${this.apiUrl}/users`).subscribe(
      (response) => {
        this.users = [...response];
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    );
  }

  deleteUser(username: string): void {
    if (!confirm(`Delete ${username}?`)) return;
    this.http.delete(`${this.apiUrl}/users/${username}`).subscribe(
      () => this.loadUsers()
    );
  }

  get activeUsersCount(): number {
    return this.users.filter(u => u.isActive).length;
  }

  get adminUsersCount(): number {
    return this.users.filter(u => u.role === 'Admin').length;
  }

  getRoleBadgeClass(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin': return 'badge-admin';
      case 'manager': return 'badge-manager';
      case 'user': return 'badge-user';
      default: return 'badge-default';
    }
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge-active' : 'badge-inactive';
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}