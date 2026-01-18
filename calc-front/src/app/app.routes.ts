import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { Register } from './components/register/register';
import { UserManagement } from './components/usermanagement/usermanagement';
import { ResumeAnalyzer } from './components/resume-analyzer/resume-analyzer';
import { ViewReports } from './components/viewreports/viewreport';



export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'user-management', component: UserManagement},
  { path: 'view-reports', component: ViewReports},
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'resume-analyzer', component: ResumeAnalyzer },
  { path: '**', redirectTo: '/login' }
];