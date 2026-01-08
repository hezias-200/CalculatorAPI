import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { CommonModule } from '@angular/common';

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


  constructor(
    private authService: Auth,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.username = this.authService.getUsername() || 'User';
    this.isAdmin = this.authService.isAdmin(this.authService.getToken() || '');
    this.userRole = this.authService.getUserRole(this.authService.getToken() || '') || '';
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