import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/usermanagment.service';
import { User } from '../../interfaces/user';
import { FormsModule } from '@angular/forms';  

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule],  
  standalone: true,
  templateUrl: './usermanagement.html',
  styleUrl: './usermanagement.css',
})
export class UserManagement implements OnInit {
  users: User[] = [];
  error: string = '';
  hasUsers: boolean = false;
  loading: boolean = false;
  filteredUsers: User[] = [];
  searchTerm: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  constructor(
    private authService: Auth,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // this.authService.isLoggedIn() != true ? this.router.navigate(['/login']) : null;

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
        this.hasUsers = this.users.length > 0;
        this.filterUsers();

        this.loading = false;

        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    );
  }
  filterUsers(): void {
    let filtered = this.users;

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term) ||
        user.id.toString().includes(term)
      );
    }
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.filteredUsers = filtered.slice(startIndex, endIndex);

  }
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.filterUsers();
    }
  }
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.filterUsers();
    }
  }
  goToPage(page: number): void {
    this.currentPage = page;
    this.filterUsers();
  }
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let end = Math.min(this.totalPages, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
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
  getAvatarColor(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'manager': return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      case 'user': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      default: return 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}