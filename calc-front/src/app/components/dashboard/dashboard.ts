import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/usermanagment.service';
import { ResumeAnalysis, ResumeService } from '../../services/resume.service';
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
  totalPassed: number = 0;
  totalAnalyses: number = 0;
  inProcess: number = 0;
  avgScore: string = '';

  totalUsers = signal(0);
  activeUsers = signal(0);
  adminUsers = signal(0);
  resumes: ResumeAnalysis[] = [];

  constructor(
    private authService: Auth,
    private userService: UserService,
    private router: Router,
    private resumesService: ResumeService
  ) { }

  ngOnInit(): void {
    this.username = this.authService.getUsername() || 'User';
    this.isAdmin = this.authService.isAdmin(this.authService.getToken() || '');
    this.userRole = this.authService.getUserRole(this.authService.getToken() || '') || '';

    if (this.isAdmin) {
      this.loadUserStats();
      this.loadResumeStats();
      this.totalPassed = this.resumesService.getPassedAnalyses();
    }
  }
  loadUserStats(): void {
    this.userService.getUsers().subscribe({
      next: () => {
        this.totalUsers.set(this.userService.getTotalUsersCount());
        this.activeUsers.set(this.userService.getActiveUsersCount());
        this.adminUsers.set(this.userService.getAdminUsersCount());
      },
      error: (err) => {
        console.error('❌ Error loading user stats:', err);
      }
    });
  }
  loadResumeStats(): void {
    this.resumesService.getHistory().subscribe({
      next: (resumes) => {
        this.resumes = resumes;
        this.totalPassed = this.resumesService.getPassedAnalyses();
        this.totalAnalyses = this.resumesService.getTotalAnalyses();
        this.inProcess = this.resumesService.getProcessingAnalyses();
        this.avgScore = this.resumesService.getAvgAnalyses();

      }
    });

  }
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  goToUserManagement(): void {
    this.userService.goToUserManagement();
  }
  goToResumeAnalyzer(): void {
    this.resumesService.goToResumeAnalyzer();
  }
  goToViewReports(): void {
    this.resumesService.goToViewReports();
  }

}