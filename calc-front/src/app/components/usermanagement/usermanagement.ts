import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/usermanagment.service';
import { User } from '../../interfaces/user';

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

  constructor(
    private authService: Auth,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.authService.isLoggedIn() != true ? this.router.navigate(['/login']) : null;

    const isAdmin = this.authService.isAdmin(this.authService.getToken() || '');
    if (!isAdmin) {
      this.error = 'Access denied';
      return;
    }

    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe(
      (response) => {
        this.users = [...response];
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    );
  }

  deleteUser(username: string): void {
    if (!confirm(`Delete ${username}?`)) return;
    this.userService.deleteUser(username).subscribe(
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