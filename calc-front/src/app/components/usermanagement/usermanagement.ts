import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/usermanagment.service';
import { User } from '../../interfaces/user';
import { FormsModule } from '@angular/forms';
import { RegisterRequest } from '../../interfaces/registerRequest';
import { Register } from '../register/register';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, FormsModule, Register],
  standalone: true,
  templateUrl: './usermanagement.html',
  styleUrls: ['./usermanagement.css', '../register/register.css']
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
  showAddUserModal: boolean = false;
  addingUser: boolean = false;
  addUserError: string = '';

  newUser: RegisterRequest = {
    username: '',
    email: '',
    password: ''
  };

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
  onUserAdded(): void {
    this.closeAddUserModal();
    this.loadUsers(); // Refresh user list
    alert('✅ User added successfully!');
  }
  openAddUserModal(): void {
    this.showAddUserModal = true;
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
    return this.users.filter(u => u.role.toLocaleLowerCase() === 'admin').length;
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
  showAddUserModalPopup(): void {
    this.showAddUserModal = true;
    this.newUser = {
      username: '',
      email: '',
      password: ''
    };
    this.addUserError = '';
  }

  closeAddUserModal(): void {
    this.showAddUserModal = false;
    this.addUserError = '';
    this.newUser = {
      username: '',
      password: '',
      email: ''
    };
  }
  addUser(): void {
    if (!this.newUser.username || !this.newUser.password) {
      this.addUserError = 'Username and password are required';
      return;
    }

    if (this.newUser.password.length < 6) {
      this.addUserError = 'Password must be at least 6 characters';
      return;
    }

    this.addingUser = true;
    this.addUserError = '';

    this.authService.register(this.newUser).subscribe({
      next: () => {
        this.addingUser = false;
        this.closeAddUserModal();
        this.loadUsers(); // Refresh user list
        alert('✅ User added successfully!');
      },
      error: (err) => {
        this.addingUser = false;
        this.addUserError = err.error?.message || 'Failed to add user';
        console.error('Error adding user:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}