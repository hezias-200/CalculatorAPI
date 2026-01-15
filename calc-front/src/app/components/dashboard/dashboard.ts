import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/usermanagment.service';
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',

})
export class Dashboard implements OnInit {
  username: string = '';
  isAdmin: boolean = false;
  userRole: string = '';

  totalUsers: number = 156;
  activeUsers: number = 42;
  adminUsers: number = 8;
  constructor(
    private authService: Auth,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.username = this.authService.getUsername() || 'User';
    this.isAdmin = this.authService.isAdmin(this.authService.getToken() || '');
    this.userRole = this.authService.getUserRole(this.authService.getToken() || '') || '';

    if (this.isAdmin) {
      this.loadUserStats();
    }
  }
  loadUserStats(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        // ✅ Update properties AFTER data loads
        this.totalUsers = this.userService.getTotalUsersCount();
        this.activeUsers = this.userService.getActiveUsersCount();
        this.adminUsers = this.userService.getAdminUsersCount();

        //this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error loading user stats:', err);
      }
    });
  }
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  goToUserManagement(): void {
    this.router.navigate(['/user-management']);
  }
  goToResumeAnalyzer(): void {
    this.router.navigate(['/resume-analyzer']);
  }
}